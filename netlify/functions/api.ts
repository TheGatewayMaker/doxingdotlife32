import serverless from "serverless-http";
import { createServer } from "../../server";

let app: any;
let serverlessHandler: any;

// Set NETLIFY flag immediately before any server initialization
if (!process.env.NETLIFY) {
  process.env.NETLIFY = "true";
  console.log(
    `[${new Date().toISOString()}] NETLIFY environment flag set to true`,
  );
}

const getApp = () => {
  if (!app) {
    try {
      console.log(
        `[${new Date().toISOString()}] Initializing Express server...`,
      );
      console.log("Environment check:", {
        hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasR2AccessKeyId: !!process.env.R2_ACCESS_KEY_ID,
        hasR2SecretAccessKey: !!process.env.R2_SECRET_ACCESS_KEY,
        hasR2AccountId: !!process.env.R2_ACCOUNT_ID,
        hasR2BucketName: !!process.env.R2_BUCKET_NAME,
        hasAuthorizedEmails: !!process.env.VITE_AUTHORIZED_EMAILS,
        nodeEnv: process.env.NODE_ENV,
      });
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
        hasAuthorizedEmails: !!process.env.VITE_AUTHORIZED_EMAILS,
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
      binary: ["image/*", "video/*", "application/octet-stream", "multipart/*"],
      request: (request: any, event: any, context: any) => {
        // Log request details for debugging
        console.log(
          `[${new Date().toISOString()}] ${event.httpMethod} ${event.path} - Content-Type: ${event.headers["content-type"] || "unknown"}`,
        );
        if (event.body) {
          const bodyPreview =
            typeof event.body === "string"
              ? event.body.substring(0, 200)
              : JSON.stringify(event.body).substring(0, 200);
          console.log(
            `[${new Date().toISOString()}] Event body (first 200 chars): ${bodyPreview}`,
          );
          console.log(
            `[${new Date().toISOString()}] Is base64 encoded: ${event.isBase64Encoded}`,
          );
        }
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
  let result: any;

  try {
    // Set a longer timeout for the context
    context.callbackWaitsForEmptyEventLoop = false;

    console.log(
      `[${new Date().toISOString()}] Incoming ${event.httpMethod} ${event.path}`,
    );
    console.log(
      `[${new Date().toISOString()}] Content-Type: ${event.headers["content-type"] || "unknown"}`,
    );

    // NETLIFY flag should already be set at module init, but ensure it's set
    if (!process.env.NETLIFY) {
      process.env.NETLIFY = "true";
    }

    try {
      const serverlessHandler = getServerlessHandler();
      result = await serverlessHandler(event, context);
    } catch (serverError) {
      const serverErrorMessage =
        serverError instanceof Error
          ? serverError.message
          : String(serverError);
      console.error(
        `[${new Date().toISOString()}] ❌ Serverless handler error:`,
        serverErrorMessage,
      );
      console.error("Serverless handler error details:", {
        message: serverErrorMessage,
        stack: serverError instanceof Error ? serverError.stack : undefined,
        event: {
          httpMethod: event.httpMethod,
          path: event.path,
        },
      });

      // Return error response from handler error
      result = {
        statusCode: 500,
        body: JSON.stringify({
          error: "Server error",
          details:
            process.env.NODE_ENV === "development"
              ? serverErrorMessage
              : "An error occurred processing your request.",
        }),
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      };
    }

    // Ensure result is always valid JSON with proper headers
    if (result && typeof result === "object") {
      if (!result.headers) {
        result.headers = {};
      }
      if (!result.headers["Content-Type"]) {
        result.headers["Content-Type"] = "application/json";
      }

      // Ensure body is a string if it's an API response
      if (
        result.body &&
        typeof result.body !== "string" &&
        typeof result.body === "object"
      ) {
        result.body = JSON.stringify(result.body);
      }
    }

    console.log(
      `[${new Date().toISOString()}] Outgoing response: ${result?.statusCode || "unknown"} for ${event.httpMethod} ${event.path}`,
    );

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[${new Date().toISOString()}] ❌ Critical handler error:`,
      errorMessage,
    );
    console.error("Critical error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      event: {
        httpMethod: event?.httpMethod,
        path: event?.path,
      },
    });

    // Return a guaranteed error response
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
