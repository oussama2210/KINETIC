import { NextRequest, NextResponse } from "next/server";
import { checkAndSyncUser } from "@/lib/auth-sync";
import { prisma } from "@/lib/prisma";
import {
  uploadMediaToZernio,
  publishPost,
  zernioEnabled,
  PLATFORM_MAP,
} from "@/lib/zernio";
import { inngest } from "@/lib/inngest/client";

/**
 * POST /api/social/schedule
 * Schedule or publish a post to social platforms via Zernio.
 * 
 * For scheduled posts: Uses Inngest to wait and publish at exact time
 * For immediate posts: Publishes directly via Zernio
 */
export async function POST(req: NextRequest) {
  try {
    if (!zernioEnabled) {
      return NextResponse.json(
        {
          error: "Social publishing is not configured. ZERNIO_API_KEY is missing.",
        },
        { status: 503 }
      );
    }

    // Authenticate user
    const dbUser = await checkAndSyncUser();
    if (!dbUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title,
      caption,
      mediaUrl,
      platforms = [],
      scheduledFor,
      publishNow = false,
    } = body;

    // Validate inputs
    if (!title || !mediaUrl || !platforms.length) {
      return NextResponse.json(
        { error: "Missing required fields: title, mediaUrl, platforms" },
        { status: 400 }
      );
    }

    // Load connected social accounts for requested platforms
    const connectedAccounts = await prisma.socialAccount.findMany({
      where: {
        userId: dbUser.id,
        platform: { in: platforms },
        connected: true,
        zernioAccountId: { not: null },
      },
    });

    if (connectedAccounts.length === 0) {
      return NextResponse.json(
        {
          error: "No connected accounts found for the selected platforms. Please connect your accounts first.",
        },
        { status: 400 }
      );
    }

    // APPROACH 1: Publish Immediately (Direct Zernio API call)
    if (publishNow) {
      // Map to Zernio platform format
      const zernioplatforms = connectedAccounts.map((account) => ({
        platform: PLATFORM_MAP[account.platform],
        accountId: account.zernioAccountId!,
      }));

      // Upload media to Zernio
      const publicUrl = await uploadMediaToZernio(
        mediaUrl,
        `${title.replace(/[^a-zA-Z0-9]/g, "_")}.mp4`
      );

      // Publish immediately
      const { postId } = await publishPost({
        title,
        content: caption,
        mediaUrl: publicUrl,
        platforms: zernioplatforms,
        publishNow: true,
      });

      // Save to database
      const scheduledPost = await prisma.scheduledPost.create({
        data: {
          userId: dbUser.id,
          title,
          caption,
          mediaUrl: publicUrl,
          platforms,
          accountIds: JSON.stringify(
            connectedAccounts.map((a) => a.zernioAccountId)
          ),
          zernioPostId: postId,
          scheduledFor: null,
          status: "PUBLISHED",
        },
      });

      return NextResponse.json({
        success: true,
        post: scheduledPost,
      });
    }

    // APPROACH 2: Schedule for Later (Use Inngest)
    // Save post to database first
    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        userId: dbUser.id,
        title,
        caption,
        mediaUrl, // Store original URL, Inngest will re-upload later
        platforms,
        accountIds: JSON.stringify(
          connectedAccounts.map((a) => a.zernioAccountId)
        ),
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: "SCHEDULED",
      },
    });

    // Send Inngest event to publish at scheduled time
    await inngest.send({
      name: "social/post.scheduled",
      data: {
        scheduledPostId: scheduledPost.id,
      },
    });

    return NextResponse.json({
      success: true,
      post: scheduledPost,
      message: "Post scheduled successfully. It will be published automatically at the scheduled time.",
    });
  } catch (err: any) {
    console.error("Error in /api/social/schedule:", err);
    return NextResponse.json(
      { error: err.message || "Failed to schedule post" },
      { status: 500 }
    );
  }
}
