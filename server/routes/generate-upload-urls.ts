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
      `[${new Date().toISOString()}] Request body type: ${typeof req.body}`,
    );
    console.log(
      `[${new Date().toISOString()}] Request body content: ${JSON.stringify(req.body).substring(0, 500)}`,
    );
    console.log(
      `[${new Date().toISOString()}] Request headers: ${JSON.stringify(req.headers)}`,
    );

    const { files } = req.body as GenerateUrlsRequest;

    console.log(`[${new Date().toISOString()}] Received files: ${files}`);
    console.log(
      `[${new Date().toISOString()}] Files type: ${typeof files}, is array: ${Array.isArray(files)}, length: ${files?.length}`,
    );

    if (!files || !Array.isArray(files) || files.length === 0) {
      console.error(`[${new Date().toISOString()}] Files validation failed:`, {
        haFiles: !!files,
        isArray: Array.isArray(files),
        length: files?.length,
        rawBody: req.body,
      });
      return res.status(400).json({
        error: "Invalid request",
        details: "files array is required and must contain at least one file",
      });
    }

    // Validate each file in the request
    for (const file of files) {
      if (!file.fileName || !file.contentType || !file.fileSize) {
        return res.status(400).json({
          error: "Invalid file metadata",
          details:
            "Each file must have fileName, contentType, and fileSize properties",
        });
      }

      if (file.fileSize > 500 * 1024 * 1024) {
        return res.status(400).json({
          error: "File too large",
          details: `File ${file.fileName} exceeds 500MB limit`,
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
