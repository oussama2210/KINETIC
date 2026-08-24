import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Neon / AWS S3 Storage Provider Configuration
const region = process.env.AWS_REGION || "us-east-2";
const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.NEON_S3_BUCKET || "neon-video-storage";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.NEON_S3_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.NEON_S3_SECRET_KEY;
const endpoint = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3;

export const hasStorageCredentials = Boolean(accessKeyId && secretAccessKey);

export function getS3Client(): S3Client | null {
  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Generate a pre-signed URL for direct video upload (Neon S3 / AWS S3)
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string = "video/mp4",
  expiresInSeconds: number = 3600
): Promise<{ uploadUrl: string; s3Key: string; bucket: string; isLiveStorage: boolean }> {
  const s3 = getS3Client();

  if (!s3) {
    // Neon Serverless Storage Development fallback URL
    const host = endpoint ? endpoint : `https://${bucketName}.s3.${region}.amazonaws.com`;
    return {
      uploadUrl: `${host}/${key}?provider=neon-storage&signed=true`,
      s3Key: key,
      bucket: bucketName,
      isLiveStorage: false,
    };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });

  return {
    uploadUrl,
    s3Key: key,
    bucket: bucketName,
    isLiveStorage: true,
  };
}

/**
 * Generate a pre-signed URL for video streaming / playback from Neon S3 storage
 */
export async function getPresignedReadUrl(
  key: string,
  expiresInSeconds: number = 86400 // 24 hours
): Promise<string> {
  const s3 = getS3Client();

  if (!s3) {
    // Return direct streaming URL from Neon storage / CDN
    const host = endpoint ? endpoint : `https://${bucketName}.s3.${region}.amazonaws.com`;
    return `${host}/${key}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

/**
 * Upload buffer directly to S3 storage
 */
export async function uploadBufferToS3(
  key: string,
  buffer: Buffer,
  contentType: string = "video/mp4"
): Promise<{ success: boolean; s3Key: string; bucket: string }> {
  const s3 = getS3Client();

  if (!s3) {
    return {
      success: false,
      s3Key: key,
      bucket: bucketName,
    };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(command);

  return {
    success: true,
    s3Key: key,
    bucket: bucketName,
  };
}

