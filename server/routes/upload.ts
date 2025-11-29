import { RequestHandler } from "express";
import {
  uploadMediaFile,
  uploadPostMetadata,
  getServersList,
  updateServersList,
  uploadPostMetadataWithThumbnail,
} from "../utils/r2-storage";

interface UploadRequest {
  title: string;
  description: string;
  country?: string;
  city?: string;
  server?: string;
  nsfw?: string | boolean;
}

const sanitizeFileName = (fileName: string): string => {
  // Remove path separators and dangerous characters
  let sanitized = fileName
    .replace(/\\/g, "") // Remove backslashes
    .replace(/\//g, "") // Remove forward slashes
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[<>:"|?*]/g, "") // Remove Windows reserved chars
    .trim();

  // Ensure it's not empty and not a reserved name
  if (!sanitized || sanitized === "." || sanitized === "..") {
    return "file";
  }

  // Limit filename length to prevent issues
  if (sanitized.length > 255) {
    sanitized =
      sanitized.substring(0, 240) + sanitized.substring(sanitized.length - 15);
  }

  return sanitized;
};

const detectImageMimeType = (
  originalMimetype: string | undefined,
  fileName: string,
): string => {
  // If browser provided a MIME type, use it
  if (originalMimetype && originalMimetype.startsWith("image/")) {
    return originalMimetype;
  }

  // Fallback: detect from file extension
  const extension = fileName.toLowerCase().split(".").pop() || "";
  const mimeTypes: { [key: string]: string } = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    jpe: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    tiff: "image/tiff",
    tif: "image/tiff",
    heic: "image/heic",
    heif: "image/heif",
    avif: "image/avif",
  };

  return mimeTypes[extension] || "image/jpeg";
};

export const handleUpload: RequestHandler = async (req, res, next) => {
  let responseSent = false;

  try {
    // Ensure we have files from multer
    if (!req.files || typeof req.files !== "object") {
      console.error("Invalid files object from multer", {
        filesType: typeof req.files,
        filesKeys: req.files ? Object.keys(req.files) : [],
      });
      if (!res.headersSent) {
        res.status(400).json({ error: "Files object is missing or invalid" });
        responseSent = true;
      }
      return;
    }

    const { title, description, country, city, server, nsfw } =
      req.body as UploadRequest;
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    // Validate required fields with detailed logging
    if (!title || !description || !files?.media || !files?.thumbnail) {
      console.error("Missing required fields", {
        title: !!title,
        description: !!description,
        media: !!files?.media,
        mediaCount: Array.isArray(files?.media) ? files.media.length : 0,
        thumbnail: !!files?.thumbnail,
      });
      if (!res.headersSent) {
        res.status(400).json({
          error:
            "Missing required fields: title, description, media files, and thumbnail are all required",
        });
        responseSent = true;
      }
      return;
    }

    // Ensure media is an array
    if (!Array.isArray(files.media)) {
      console.error("Media files are not in array format", {
        mediaType: typeof files.media,
        mediaKeys: Object.keys(files.media || {}),
      });
      if (!res.headersSent) {
        res.status(400).json({ error: "Media files format is invalid" });
        responseSent = true;
      }
      return;
    }

    if (files.media.length === 0) {
      console.error("No media files provided");
      if (!res.headersSent) {
        res.status(400).json({ error: "At least one media file is required" });
        responseSent = true;
      }
      return;
    }

    // Validate thumbnail is an array with at least one file
    if (!Array.isArray(files.thumbnail) || files.thumbnail.length === 0) {
      console.error("Thumbnail validation failed", {
        thumbnailType: typeof files.thumbnail,
        thumbnailLength: Array.isArray(files.thumbnail)
          ? files.thumbnail.length
          : 0,
      });
      if (!res.headersSent) {
        res.status(400).json({ error: "Thumbnail is required" });
        responseSent = true;
      }
      return;
    }

    const thumbnailFile = files.thumbnail[0];
    const postId = Date.now().toString();
    const thumbnailFileName = `thumbnail-${Date.now()}`;

    try {
      const mediaCount = files.media.length;
      console.log(
        `[${new Date().toISOString()}] Starting upload for post ${postId} with ${mediaCount} media file(s)`,
      );

      // Upload thumbnail with error handling
      let thumbnailUrl: string;
      try {
        const thumbnailMimeType = detectImageMimeType(
          thumbnailFile.mimetype,
          thumbnailFile.originalname || "thumbnail",
        );
        thumbnailUrl = await uploadMediaFile(
          postId,
          thumbnailFileName,
          thumbnailFile.buffer,
          thumbnailMimeType,
        );
        console.log(
          `[${new Date().toISOString()}] ✅ Thumbnail uploaded successfully for post ${postId}`,
        );
      } catch (thumbnailError) {
        console.error("Thumbnail upload failed:", thumbnailError);
        throw new Error(
          `Failed to upload thumbnail: ${thumbnailError instanceof Error ? thumbnailError.message : String(thumbnailError)}`,
        );
      }

      // Upload all media files with improved error handling
      const mediaFileNames: string[] = [];
      const uploadErrors: Array<{ index: number; error: string }> = [];

      for (let i = 0; i < files.media.length; i++) {
        try {
          const mediaFile = files.media[i];

          // Validate file exists and has buffer
          if (!mediaFile || !mediaFile.buffer) {
            throw new Error(`File ${i + 1} is missing or has no buffer data`);
          }

          const originalName = mediaFile.originalname || `media-${i + 1}`;
          const sanitizedName = sanitizeFileName(originalName);
          const mediaFileName = `${Date.now()}-${i}-${sanitizedName}`;

          console.log(
            `Uploading media file ${i + 1}/${mediaCount}: ${mediaFileName} (${(mediaFile.size / 1024 / 1024).toFixed(2)}MB)`,
          );

          const mediaFileMimeType = mediaFile.mimetype
            ? detectImageMimeType(
                mediaFile.mimetype,
                mediaFile.originalname || "media",
              )
            : "application/octet-stream";

          await uploadMediaFile(
            postId,
            mediaFileName,
            mediaFile.buffer,
            mediaFileMimeType,
          );

          mediaFileNames.push(mediaFileName);
          console.log(
            `[${new Date().toISOString()}] ✅ File ${i + 1}/${mediaCount} uploaded successfully`,
          );
        } catch (fileError) {
          const errorMsg =
            fileError instanceof Error ? fileError.message : String(fileError);
          console.error(`Error uploading file ${i + 1}:`, errorMsg);
          uploadErrors.push({
            index: i + 1,
            error: errorMsg,
          });
        }
      }

      // Check for upload errors after processing all files
      if (uploadErrors.length > 0) {
        throw new Error(
          `Failed to upload ${uploadErrors.length} file(s): ${uploadErrors.map((e) => `File ${e.index}: ${e.error}`).join("; ")}`,
        );
      }

      console.log(`Successfully uploaded ${mediaFileNames.length} media files`);

      const postMetadata = {
        id: postId,
        title,
        description,
        country: country || "",
        city: city || "",
        server: server || "",
        nsfw: nsfw === "true" || nsfw === true,
        mediaFiles: mediaFileNames,
        createdAt: new Date().toISOString(),
      };

      await uploadPostMetadataWithThumbnail(postId, postMetadata, thumbnailUrl);

      if (server && server.trim()) {
        try {
          const servers = await getServersList();

          // Ensure servers is an array before spreading
          if (!Array.isArray(servers)) {
            console.warn(
              "Servers list is not an array, initializing with empty array",
            );
            await updateServersList([server.trim()]);
          } else {
            const serverSet = new Set(servers);
            serverSet.add(server.trim());
            const updatedServers = Array.from(serverSet);
            updatedServers.sort();
            await updateServersList(updatedServers);
          }
        } catch (serverError) {
          console.error("Error updating servers list:", serverError);
        }
      }

      console.log(
        `[${new Date().toISOString()}] ✅ Post ${postId} uploaded successfully`,
      );

      if (!res.headersSent) {
        res.json({
          success: true,
          message: "Post uploaded successfully",
          postId,
          mediaCount: mediaFileNames.length,
        });
        responseSent = true;
      }
    } catch (r2Error) {
      const errorMessage =
        r2Error instanceof Error ? r2Error.message : String(r2Error);
      console.error(
        `[${new Date().toISOString()}] ❌ R2 upload error for post ${postId}:`,
        errorMessage,
      );
      console.error("Detailed R2 error:", {
        error: errorMessage,
        stack: r2Error instanceof Error ? r2Error.stack : undefined,
        postId,
        mediaCount: files.media ? files.media.length : 0,
      });
      if (!res.headersSent) {
        res.status(500).json({
          error: "Upload to R2 failed",
          details:
            process.env.NODE_ENV === "development"
              ? errorMessage
              : "Failed to upload files to storage. Please check your R2 configuration and try again.",
        });
        responseSent = true;
      }
      // Don't return here to let it fall through to the outer catch
      throw r2Error;
    }
  } catch (error) {
    // Prevent double response
    if (responseSent) {
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[${new Date().toISOString()}] ❌ Upload error (general):`,
      errorMessage,
    );
    console.error("Full error details:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Upload failed",
        details:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "An error occurred during upload. Please check your server configuration.",
      });
      responseSent = true;
    }
  }
};
