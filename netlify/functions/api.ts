import serverless from "serverless-http";
import { createServer } from "../../server";

let app: any;
let serverlessHandler: any;

const getApp = () => {
  if (!app) {
    try {
      console.log(
        `[${new Date().toISOString()}] Initializing Express server...`,
      );
      app = createServer();
      console.log(
        `[${new Date().toISOString()}] ✅ Express server initialized successfully`,
      );
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] ❌ Failed to create server:`,
        error,
      );
      console.error("Environment variables available:", {
        hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasR2AccessKeyId: !!process.env.R2_ACCESS_KEY_ID,
        hasR2SecretAccessKey: !!process.env.R2_SECRET_ACCESS_KEY,
        hasR2AccountId: !!process.env.R2_ACCOUNT_ID,
        hasR2BucketName: !!process.env.R2_BUCKET_NAME,
      });
      throw error;
    }
  }
  return app;
};

const getServerlessHandler = () => {
  if (!serverlessHandler) {
    const app = getApp();
    serverlessHandler = serverless(app, {
      basePath: "/.netlify/functions/api",
      binary: [
        "image/*",
        "video/*",
        "application/octet-stream",
        "multipart/*",
        "application/x-www-form-urlencoded",
        "*/*",
      ],
      request: (request: any, event: any, context: any) => {
        // Log request details for debugging
        console.log(
          `[${new Date().toISOString()}] ${event.httpMethod} ${event.path} - Content-Type: ${event.headers["content-type"] || "unknown"}`,
        );
      },
      response: (response: any) => {
        // Ensure Content-Type is always set for responses
        if (!response.headers) {
          response.headers = {};
        }
        if (!response.headers["content-type"]) {
          response.headers["content-type"] = "application/json";
        }
        return response;
      },
    });
  }
  return serverlessHandler;
};

export const handler = async (event: any, context: any) => {
  try {
    // Set a longer timeout for the context
    context.callbackWaitsForEmptyEventLoop = false;

    console.log(
      `[${new Date().toISOString()}] Incoming ${event.httpMethod} ${event.path}`,
    );

    // Add NETLIFY flag for serverless environment detection
    if (!process.env.NETLIFY) {
      process.env.NETLIFY = "true";
    }

    const handler = getServerlessHandler();
    const result = await handler(event, context);

    // Ensure result is always valid JSON
    if (result && typeof result === "object") {
      if (!result.headers) {
        result.headers = {};
      }
      if (!result.headers["Content-Type"]) {
        result.headers["Content-Type"] = "application/json";
      }
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[${new Date().toISOString()}] ❌ Handler error:`,
      errorMessage,
    );
    console.error("Error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      event: {
        httpMethod: event.httpMethod,
        path: event.path,
      },
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "An unexpected error occurred on the server.",
      }),
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    };
  }
};
