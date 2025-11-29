import express from "express";
import cors from "cors";
import multer from "multer";
import { handleDemo } from "./routes/demo";
import { handleUpload } from "./routes/upload";
import { handleGetPosts } from "./routes/posts";
import { handleGetServers } from "./routes/servers";
import {
  handleDeletePost,
  handleDeleteMediaFile,
  handleUpdatePost,
} from "./routes/admin";
import { handleLogout, handleCheckAuth, authMiddleware } from "./routes/auth";
import { validateR2Configuration } from "./utils/r2-storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB per file for long videos
  },
});

export function createServer() {
  const app = express();

  // Middleware - order matters, apply parsers first
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: false,
    }),
  );

  // JSON and URL-encoded body parsing with proper limits
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Error handling for body parsing
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (err instanceof SyntaxError && "body" in err) {
        console.error("JSON parse error:", err);
        return res.status(400).json({
          error: "Invalid JSON in request body",
          details:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
      next(err);
    },
  );

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const originalJson = res.json;

    res.json = function (body) {
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
      );
      return originalJson.call(this, body);
    };

    next();
  });

  // Health check endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      const hasFirebaseConfig = !!process.env.FIREBASE_PROJECT_ID;
      const hasAuthorizedEmails = !!process.env.VITE_AUTHORIZED_EMAILS;
      const r2Validation = await validateR2Configuration();

      res.json({
        status: r2Validation.isValid ? "ok" : "partial",
        environment: process.env.NODE_ENV || "development",
        firebaseConfigured: hasFirebaseConfig,
        authorizedEmailsConfigured: hasAuthorizedEmails,
        r2: {
          configured: r2Validation.isValid,
          message: r2Validation.message,
          details:
            process.env.NODE_ENV === "development"
              ? r2Validation.details
              : undefined,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({
        status: "error",
        environment: process.env.NODE_ENV || "development",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/check", handleCheckAuth);

  // Forum API routes
  // Longer timeout for upload endpoint (10 minutes) to handle large files and multiple attachments
  const uploadTimeout = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    // In serverless environments like Netlify Functions, sockets are not available
    // Skip socket timeout handling in serverless contexts
    if (process.env.NETLIFY === "true" || !req.socket) {
      console.log("Serverless environment detected: skipping socket timeout");
      next();
      return;
    }

    const timeout = 10 * 60 * 1000; // 10 minutes

    // Set timeout on the underlying socket, not the request/response objects
    try {
      if (req.socket) {
        req.socket.setTimeout(timeout);
      }
      if (res.socket) {
        res.socket.setTimeout(timeout);
      }

      // Handle timeout errors
      const handleTimeout = () => {
        console.error("Request timeout for upload");
        if (!res.headersSent) {
          res.status(408).json({
            error: "Request timeout",
            details: "Upload took too long to complete",
          });
        }
      };

      if (req.socket) {
        req.socket.on("timeout", handleTimeout);
      }
      if (res.socket) {
        res.socket.on("timeout", handleTimeout);
      }
    } catch (error) {
      console.error("Error setting socket timeout:", error);
    }

    next();
  };

  // Multer error handling middleware
  const multerErrorHandler = (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (err.name === "MulterError") {
      console.error("Multer error:", err);
      if (err.code === "FILE_TOO_LARGE") {
        return res.status(413).json({
          error: "File too large",
          details: `Maximum file size is ${err.limit} bytes`,
        });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          error: "Too many files",
          details: err.message,
        });
      }
      return res.status(400).json({
        error: "File upload error",
        details:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Failed to parse file upload",
      });
    }
    next(err);
  };

  app.post(
    "/api/upload",
    uploadTimeout,
    authMiddleware,
    (req, res, next) => {
      try {
        upload.fields([
          { name: "media", maxCount: 100 },
          { name: "thumbnail", maxCount: 1 },
        ])(req, res, (err) => {
          if (err) {
            return multerErrorHandler(err, req, res, next);
          }
          next();
        });
      } catch (error) {
        console.error("Error in upload middleware:", error);
        return multerErrorHandler(error, req, res, next);
      }
    },
    handleUpload,
  );

  app.get("/api/posts", handleGetPosts);
  app.get("/api/servers", handleGetServers);

  // Admin routes (protected by auth middleware)
  app.delete("/api/posts/:postId", authMiddleware, handleDeletePost);
  app.delete(
    "/api/posts/:postId/media/:fileName",
    authMiddleware,
    handleDeleteMediaFile,
  );
  app.put("/api/posts/:postId", authMiddleware, handleUpdatePost);

  // Media proxy endpoint for additional CORS support
  app.get("/api/media/:postId/:fileName", async (req, res) => {
    try {
      const { postId, fileName } = req.params;

      if (!postId || !fileName) {
        return res.status(400).json({ error: "Invalid request" });
      }

      // Validate that only legitimate paths are accessed
      if (fileName.includes("..") || fileName.includes("/")) {
        return res.status(403).json({ error: "Invalid file path" });
      }

      const mediaUrl = `${process.env.R2_PUBLIC_URL || `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`}/posts/${postId}/${fileName}`;

      res.set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=31536000",
      });

      const response = await fetch(mediaUrl);
      const contentType = response.headers.get("content-type");

      if (contentType) {
        res.set("Content-Type", contentType);
      }

      res.set({
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=31536000",
      });

      if (response.ok && response.body) {
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      } else {
        res
          .status(response.status || 500)
          .json({ error: "Failed to fetch media" });
      }
    } catch (err) {
      console.error("Media proxy error:", err);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Catch-all async error handler wrapper
  const asyncHandler = (
    fn: (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => Promise<any>,
  ) => {
    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  // Global error handler middleware - MUST be last
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Unhandled error:", err);

      // Prevent sending response twice
      if (res.headersSent) {
        console.error("Headers already sent, cannot send error response");
        return;
      }

      // Set Content-Type to JSON to ensure proper response format
      res.set("Content-Type", "application/json");

      const status =
        err.status ||
        err.statusCode ||
        (err.name === "MulterError" ? 400 : 500);
      const message = err.message || "An unexpected error occurred";
      const details =
        process.env.NODE_ENV === "development"
          ? {
              message: err.message,
              stack: err.stack,
              errorName: err.name,
            }
          : undefined;

      res.status(status).json({
        error: message,
        ...(details && { details }),
      });
    },
  );

  return app;
}
