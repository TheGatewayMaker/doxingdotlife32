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

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    const hasFirebaseConfig = !!process.env.FIREBASE_PROJECT_ID;
    const hasAuthorizedEmails = !!process.env.VITE_AUTHORIZED_EMAILS;

    res.json({
      status: "ok",
      environment: process.env.NODE_ENV || "development",
      firebaseConfigured: hasFirebaseConfig,
      authorizedEmailsConfigured: hasAuthorizedEmails,
      timestamp: new Date().toISOString(),
    });
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
  // Upload endpoint with longer timeout for handling large files
  const uploadRouter = express.Router();
  uploadRouter.post(
    "/api/upload",
    authMiddleware,
    upload.fields([
      { name: "media", maxCount: 100 }, // Support up to 100 files
      { name: "thumbnail", maxCount: 1 },
    ]),
    handleUpload,
  );

  app.use((req, res, next) => {
    // Set longer timeout for upload endpoint (5 minutes)
    if (req.path === "/api/upload") {
      req.setTimeout(5 * 60 * 1000);
      res.setTimeout(5 * 60 * 1000);
    }
    next();
  });

  app.post(
    "/api/upload",
    authMiddleware,
    upload.fields([
      { name: "media", maxCount: 100 }, // Support up to 100 files
      { name: "thumbnail", maxCount: 1 },
    ]),
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

  return app;
}
