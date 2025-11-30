import { RequestHandler } from "express";
import {
  generatePresignedUploadUrls,
  PresignedUrlRequest,
} from "../utils/r2-storage";

interface GenerateUrlsRequest {
  files: PresignedUrlRequest[];
}

interface GenerateUrlsResponse {
  postId: string;
  presignedUrls: Array<{
    fileName: string;
    signedUrl: string;
    contentType: string;
    fileSize: number;
  }>;
}

export const handleGenerateUploadUrls: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    console.log(
      `[${new Date().toISOString()}] === 📤 GENERATE UPLOAD URLS REQUEST ===`,
    );
    console.log(`[${new Date().toISOString()}] Request method: ${req.method}`);
    console.log(`[${new Date().toISOString()}] Request path: ${req.path}`);
    console.log(
      `[${new Date().toISOString()}] Content-Type header: ${req.headers["content-type"]}`,
    );
    console.log(
      `[${new Date().toISOString()}] Content-Length header: ${req.headers["content-length"]}`,
    );
    console.log(
      `[${new Date().toISOString()}] Request body type: ${typeof req.body}`,
    );

    if (!req.body) {
      console.error(
        `[${new Date().toISOString()}] ❌ REQUEST BODY IS EMPTY/NULL`,
      );
      return res.status(400).json({
        error: "Invalid request",
        details: "Request body is empty",
      });
    }

    console.log(
      `[${new Date().toISOString()}] Request body keys: ${Object.keys(req.body)}`,
    );

    if (typeof req.body === "string") {
      console.warn(
        `[${new Date().toISOString()}] ⚠️ Body is still a string, attempting parse...`,
      );
      try {
        req.body = JSON.parse(req.body);
        console.log(
          `[${new Date().toISOString()}] ✅ Successfully parsed string body`,
        );
      } catch (parseErr) {
        console.error(
          `[${new Date().toISOString()}] ❌ Failed to parse string body:`,
          parseErr,
        );
        return res.status(400).json({
          error: "Invalid JSON in request body",
          details:
            parseErr instanceof Error ? parseErr.message : "JSON parse error",
        });
      }
    }

    console.log(
      `[${new Date().toISOString()}] Full request body: ${JSON.stringify(req.body, null, 2).substring(0, 1000)}`,
    );

    const { files } = req.body as GenerateUrlsRequest;

    if (files) {
      console.log(`[${new Date().toISOString()}] Files received:`, {
        isArray: Array.isArray(files),
        length: files.length,
        firstFile: files[0],
      });
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      console.error(
        `[${new Date().toISOString()}] ❌ FILES VALIDATION FAILED:`,
        {
          hasFilesProperty: "files" in (req.body || {}),
          filesValue: req.body?.files,
          isArray: Array.isArray(files),
          length: files?.length,
          allBodyKeys: Object.keys(req.body || {}),
          fullBody: JSON.stringify(req.body),
        },
      );
      return res.status(400).json({
        error: "Invalid request",
        details: "files array is required and must contain at least one file",
        debug: {
          receivedKeys: Object.keys(req.body || {}),
          filesProperty: req.body?.files,
          bodyType: typeof req.body,
        },
      });
    }

    // Validate each file in the request
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      console.log(`[${new Date().toISOString()}] Validating file ${i}:`, {
        fileKeys: Object.keys(file || {}),
        file: file,
      });

      if (!file) {
        return res.status(400).json({
          error: "Invalid file metadata",
          details: `File at index ${i} is null or undefined`,
        });
      }

      const { fileName, contentType, fileSize } = file as any;

      if (!fileName || typeof fileName !== "string" || fileName.trim() === "") {
        return res.status(400).json({
          error: "Invalid file metadata",
          details: `File ${i}: fileName must be a non-empty string. Received: ${JSON.stringify(fileName)}`,
        });
      }

      if (
        !contentType ||
        typeof contentType !== "string" ||
        contentType.trim() === ""
      ) {
        return res.status(400).json({
          error: "Invalid file metadata",
          details: `File ${i} (${fileName}): contentType must be a non-empty string. Received: ${JSON.stringify(contentType)}`,
        });
      }

      if (
        fileSize === undefined ||
        fileSize === null ||
        typeof fileSize !== "number" ||
        fileSize <= 0
      ) {
        return res.status(400).json({
          error: "Invalid file metadata",
          details: `File ${i} (${fileName}): fileSize must be a positive number. Received: ${JSON.stringify(fileSize)}`,
        });
      }

      if (fileSize > 500 * 1024 * 1024) {
        return res.status(400).json({
          error: "File too large",
          details: `File ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds 500MB limit`,
        });
      }
    }

    const postId = Date.now().toString();

    console.log(
      `[${new Date().toISOString()}] Generating presigned URLs for ${files.length} file(s)`,
    );

    const presignedUrls = await generatePresignedUploadUrls(postId, files);

    const response: GenerateUrlsResponse = {
      postId,
      presignedUrls,
    };

    res.json(response);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error generating presigned URLs:", errorMsg);

    res.status(500).json({
      error: "Failed to generate upload URLs",
      details:
        process.env.NODE_ENV === "development"
          ? errorMsg
          : "Unable to generate presigned upload URLs. Please check your R2 configuration.",
    });
  }
};
