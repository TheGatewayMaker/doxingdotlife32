import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

interface PostMetadata {
  id: string;
  title: string;
  description: string;
  country: string;
  city: string;
  server: string;
  mediaFiles: string[];
  createdAt: string;
}

const getR2Client = (): S3Client => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;

  if (!accountId || !accessKeyId || !secretAccessKey || !endpoint) {
    const missing = [];
    if (!accountId) missing.push("R2_ACCOUNT_ID");
    if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
    if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
    if (!endpoint) missing.push("R2_ENDPOINT");

    console.error("Missing R2 env variables:", missing);
    console.error(
      "Available env keys:",
      Object.keys(process.env).filter((k) => k.startsWith("R2_")),
    );

    throw new Error(
      `Missing required R2 environment variables: ${missing.join(", ")}`,
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });
};

const getBucketName = (): string => {
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("Missing required environment variable: R2_BUCKET_NAME");
  }
  return bucketName;
};

export const getMediaUrl = (key: string): string => {
  const endpoint = process.env.R2_ENDPOINT;
  const bucketName = getBucketName();
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!endpoint) {
    throw new Error("Missing R2_ENDPOINT");
  }

  // If a custom public URL is provided, use it
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }

  // Otherwise, construct the public R2 URL
  // For public R2 buckets, the URL format is: https://bucket-name.r2.cloudflarestorage.com
  // Extract the account ID from the endpoint
  const accountIdMatch = endpoint.match(/https:\/\/([a-z0-9]+)\.r2\.cloudflarestorage\.com/);
  if (accountIdMatch) {
    const accountId = accountIdMatch[1];
    // Use public bucket format
    return `https://${bucketName}.r2.cloudflarestorage.com/${key}`;
  }

  // Fallback to original format
  return `${endpoint}/${bucketName}/${key}`;
};

export const uploadMediaFile = async (
  postId: string,
  fileName: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> => {
  const client = getR2Client();
  const bucketName = getBucketName();
  const key = `posts/${postId}/${fileName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return getMediaUrl(key);
};

export const uploadPostMetadata = async (
  postId: string,
  metadata: PostMetadata,
): Promise<void> => {
  const client = getR2Client();
  const bucketName = getBucketName();
  const key = `posts/${postId}/metadata.json`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: "application/json",
    }),
  );
};

export const listPostFolders = async (): Promise<string[]> => {
  const client = getR2Client();
  const bucketName = getBucketName();
  const postIds: Set<string> = new Set();

  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: "posts/",
        Delimiter: "/",
        ContinuationToken: continuationToken,
      }),
    );

    if (response.CommonPrefixes) {
      for (const prefix of response.CommonPrefixes) {
        if (prefix.Prefix) {
          const postId = prefix.Prefix.replace("posts/", "").replace("/", "");
          if (postId) {
            postIds.add(postId);
          }
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return Array.from(postIds);
};

export const getPostMetadata = async (
  postId: string,
): Promise<PostMetadata | null> => {
  const client = getR2Client();
  const bucketName = getBucketName();
  const key = `posts/${postId}/metadata.json`;

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );

    if (response.Body) {
      const bodyString = await response.Body.transformToString();
      return JSON.parse(bodyString) as PostMetadata;
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const listPostFiles = async (postId: string): Promise<string[]> => {
  const client = getR2Client();
  const bucketName = getBucketName();
  const files: string[] = [];

  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `posts/${postId}/`,
        ContinuationToken: continuationToken,
      }),
    );

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (
          obj.Key &&
          obj.Key !== `posts/${postId}/metadata.json` &&
          obj.Key !== `posts/${postId}/`
        ) {
          files.push(obj.Key.split("/").pop() || "");
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return files.filter((f) => f);
};

export const updateServersList = async (servers: string[]): Promise<void> => {
  const client = getR2Client();
  const bucketName = getBucketName();
  const key = "servers/list.json";

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(servers, null, 2),
      ContentType: "application/json",
    }),
  );
};

export const getServersList = async (): Promise<string[]> => {
  const client = getR2Client();
  const bucketName = getBucketName();
  const key = "servers/list.json";

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );

    if (response.Body) {
      const bodyString = await response.Body.transformToString();
      return JSON.parse(bodyString) as string[];
    }

    return [];
  } catch (error) {
    return [];
  }
};

interface PostMetadataWithThumbnail extends PostMetadata {
  thumbnail?: string;
}

export const uploadPostMetadataWithThumbnail = async (
  postId: string,
  metadata: PostMetadata,
  thumbnailUrl: string,
): Promise<void> => {
  const client = getR2Client();
  const bucketName = getBucketName();
  const key = `posts/${postId}/metadata.json`;

  const metadataWithThumbnail: PostMetadataWithThumbnail = {
    ...metadata,
    thumbnail: thumbnailUrl,
  };

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(metadataWithThumbnail, null, 2),
      ContentType: "application/json",
    }),
  );
};

export interface PostWithThumbnail extends PostMetadata {
  thumbnail?: string;
}

export const getPostWithThumbnail = async (
  postId: string,
): Promise<PostWithThumbnail | null> => {
  const metadata = await getPostMetadata(postId);
  if (!metadata) {
    return null;
  }

  let thumbnail: string | undefined;

  const metadataWithThumbnail = metadata as PostMetadataWithThumbnail;
  if (metadataWithThumbnail.thumbnail) {
    thumbnail = metadataWithThumbnail.thumbnail;
  } else if (metadata.mediaFiles && metadata.mediaFiles.length > 0) {
    const firstMediaFile = metadata.mediaFiles[0];
    thumbnail = getMediaUrl(`posts/${postId}/${firstMediaFile}`);
  }

  return {
    ...metadata,
    thumbnail,
  };
};
