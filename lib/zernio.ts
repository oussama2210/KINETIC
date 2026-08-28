/**
 * Zernio SDK wrapper for social media publishing.
 * Handles OAuth connect, profile management, and multi-platform post scheduling.
 */

import Zernio from "@zernio/node";
import type { User } from "@prisma/client";
import { prisma } from "./prisma";

// Platform mapping: our internal IDs -> Zernio platform slugs
export const PLATFORM_MAP: Record<string, string> = {
  TIKTOK: "tiktok",
  REELS: "instagram",
  SHORTS: "youtube",
  X: "twitter",
  LINKEDIN: "linkedin",
  FACEBOOK: "facebook",
} as const;

// Reverse map for OAuth callback
export const REVERSE_PLATFORM_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PLATFORM_MAP).map(([key, value]) => [value, key])
);

export const zernioEnabled = Boolean(process.env.ZERNIO_API_KEY);

/**
 * Get configured Zernio client instance.
 * Throws clear error if API key is missing.
 */
export function getZernio(): Zernio {
  const apiKey = process.env.ZERNIO_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ZERNIO_API_KEY is not configured. Set it in your .env file to enable social publishing."
    );
  }
  return new Zernio({ apiKey });
}

/**
 * Ensure the user has a Zernio profile ID.
 * Creates one lazily if missing, stores it on User.zernioProfileId.
 */
export async function ensureProfileId(user: User): Promise<string> {
  // Return existing profile ID if present
  if (user.zernioProfileId) {
    return user.zernioProfileId;
  }

  // Fallback to env ZERNIO_PROFILE_ID if set (for shared dev profile)
  const envProfileId = process.env.ZERNIO_PROFILE_ID;
  if (envProfileId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { zernioProfileId: envProfileId },
    });
    return envProfileId;
  }

  // Create new Zernio profile for this user
  const zernio = getZernio();
  const profileName = user.email || `User ${user.id}`;

  try {
    const response = await zernio.profiles.createProfile({
      body: { name: profileName },
    });

    const profileId = response.data?.profile?._id;
    if (!profileId) {
      throw new Error("Zernio createProfile did not return a profile ID");
    }

    // Store the profile ID on the user
    await prisma.user.update({
      where: { id: user.id },
      data: { zernioProfileId: profileId },
    });

    return profileId;
  } catch (err) {
    console.error("Failed to create Zernio profile:", err);
    throw new Error(
      `Could not create Zernio profile for user ${user.id}: ${err}`
    );
  }
}

/**
 * Generate OAuth connect URL for a platform.
 * User clicks this to authorize their social account via Zernio.
 */
export async function getConnectUrlFor(
  platform: string,
  profileId: string,
  redirectUrl: string
): Promise<string> {
  const zernio = getZernio();
  const zernioSlug = PLATFORM_MAP[platform];

  if (!zernioSlug) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  try {
    const response = await zernio.connect.getConnectUrl({
      path: { platform: zernioSlug },
      query: {
        profileId,
        redirect_url: redirectUrl,
      },
    });

    const authUrl = response.data?.authUrl;
    if (!authUrl) {
      throw new Error("Zernio getConnectUrl did not return authUrl");
    }

    return authUrl;
  } catch (err) {
    console.error(`Failed to get Zernio connect URL for ${platform}:`, err);
    throw new Error(`Could not generate OAuth URL for ${platform}: ${err}`);
  }
}

/**
 * Upload media to Zernio's storage and return the public URL.
 * This ensures the video is accessible to Zernio's scheduler even after
 * our signed URLs expire.
 */
export async function uploadMediaToZernio(
  sourceUrl: string,
  filename?: string
): Promise<string> {
  const zernio = getZernio();

  try {
    // Step 1: Get presigned upload URL from Zernio
    const response = await zernio.media.getMediaPresignedUrl({
      body: {
        filename: filename || `video-${Date.now()}.mp4`,
        contentType: "video/mp4",
      },
    });

    const uploadUrl = response.data?.uploadUrl;
    const publicUrl = response.data?.publicUrl;

    if (!uploadUrl || !publicUrl) {
      throw new Error("Zernio did not return upload/public URLs");
    }

    // Step 2: Fetch the video from our source URL
    const videoResponse = await fetch(sourceUrl);
    if (!videoResponse.ok) {
      throw new Error(
        `Failed to fetch source video: ${videoResponse.status} ${videoResponse.statusText}`
      );
    }

    const videoBlob = await videoResponse.blob();

    // Step 3: PUT the video bytes to Zernio's presigned upload URL
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: videoBlob,
      headers: {
        "Content-Type": "video/mp4",
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `Failed to upload to Zernio: ${uploadResponse.status} ${uploadResponse.statusText}`
      );
    }

    return publicUrl;
  } catch (err) {
    console.error("Failed to upload media to Zernio:", err);
    throw new Error(`Media upload failed: ${err}`);
  }
}

/**
 * Publish or schedule a post to multiple social platforms via Zernio.
 */
export async function publishPost(params: {
  content?: string;
  title?: string;
  mediaUrl: string;
  platforms: Array<{ platform: string; accountId: string }>;
  scheduledFor?: Date | null;
  publishNow?: boolean;
}): Promise<{ postId: string }> {
  const zernio = getZernio();
  const {
    content,
    title,
    mediaUrl,
    platforms,
    scheduledFor,
    publishNow = false,
  } = params;

  try {
    const response = await zernio.posts.createPost({
      body: {
        title,
        content,
        mediaItems: [
          {
            type: "video",
            url: mediaUrl,
            mimeType: "video/mp4",
          },
        ],
        platforms: platforms.map((p) => ({
          platform: p.platform,
          accountId: p.accountId,
        })),
        ...(scheduledFor && !publishNow
          ? { scheduledFor: scheduledFor.toISOString() }
          : {}),
        ...(publishNow ? { publishNow: true } : {}),
        timezone: "UTC",
      },
    });

    const postId = response.data?.post?.id || response.data?.id;
    if (!postId) {
      throw new Error("Zernio createPost did not return a post ID");
    }

    return { postId };
  } catch (err) {
    console.error("Failed to create Zernio post:", err);
    throw new Error(`Post creation failed: ${err}`);
  }
}
