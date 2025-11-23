import "dotenv/config";
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
import {
  handleLogin,
  handleLogout,
  handleCheckAuth,
  authMiddleware,
} from "./routes/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

export function createServer() {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: false,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/check", handleCheckAuth);

  // Debug endpoint to check environment variables
  app.get("/api/debug/env", (_req, res) => {
    const r2Keys = Object.keys(process.env).filter((k) => k.startsWith("R2_"));
    const r2Values: Record<string, string | undefined> = {};
    r2Keys.forEach((key) => {
      r2Values[key] = process.env[key] ? "SET" : "MISSING";
    });
    res.json({
      r2_configured: r2Keys.length === 4,
      r2_variables: r2Values,
      all_r2_keys: r2Keys,
    });
  });

  // Forum API routes
  app.post(
    "/api/upload",
    authMiddleware,
    upload.fields([
      { name: "media", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    handleUpload,
  );
  app.get("/api/posts", handleGetPosts);
  app.get("/api/servers", handleGetServers);

  // Admin routes (protected by auth middleware)
  app.delete("/api/posts/:postId", authMiddleware, handleDeletePost);
  app.delete("/api/posts/:postId/media/:fileName", authMiddleware, handleDeleteMediaFile);
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
