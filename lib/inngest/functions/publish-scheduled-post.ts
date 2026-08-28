import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { publishPost, uploadMediaToZernio, PLATFORM_MAP } from "@/lib/zernio";

export interface PublishScheduledPostEventData {
  scheduledPostId: string;
}

/**
 * Publishes a scheduled social media post at the exact scheduled time.
 * 
 * This workflow:
 * 1. Waits until the scheduled time (using Inngest's sleep)
 * 2. Loads the post from database
 * 3. Uploads video to Zernio (fresh upload to avoid URL expiration)
 * 4. Publishes to selected platforms via Zernio
 * 5. Updates database status
 * 
 * Benefits of using Inngest:
 * - Automatic retries if Zernio API fails
 * - Can cancel posts before they publish
 * - Monitors all scheduled posts in one dashboard
 * - Handles timezone issues consistently
 */
export const publishScheduledPostWorkflow = inngest.createFunction(
  {
    id: "publish-scheduled-post",
    retries: 3, // Retry up to 3 times if Zernio fails

    // Mark as FAILED if all retries exhausted
    onFailure: async ({ event, error }) => {
      const original = (event.data as { event?: { data?: PublishScheduledPostEventData } }).event;
      const scheduledPostId = original?.data?.scheduledPostId;
      if (!scheduledPostId) return;

      try {
        await prisma.scheduledPost.update({
          where: { id: scheduledPostId },
          data: {
            status: "FAILED",
            error: error?.message || "Publishing failed after retries",
            updatedAt: new Date(),
          },
        });
      } catch (e) {
        console.warn("[Publish] Failed to mark post as FAILED:", e);
      }
    },
  },
  [{ event: "social/post.scheduled" }],
  async ({ event, step }) => {
    const { scheduledPostId } = event.data as PublishScheduledPostEventData;

    // Step 1: Load scheduled post from database
    const post = await step.run("load-scheduled-post", async () => {
      const scheduledPost = await prisma.scheduledPost.findUnique({
        where: { id: scheduledPostId },
        include: {
          user: {
            select: {
              socialAccounts: {
                where: {
                  connected: true,
                  zernioAccountId: { not: null },
                },
              },
            },
          },
        },
      });

      if (!scheduledPost) {
        throw new Error(`ScheduledPost ${scheduledPostId} not found`);
      }

      // Check if post was cancelled
      if (scheduledPost.status === "CANCELLED") {
        throw new Error("Post was cancelled by user");
      }

      return scheduledPost;
    });

    // Step 2: Wait until scheduled time
    if (post.scheduledFor) {
      const now = new Date();
      const scheduledTime = new Date(post.scheduledFor);
      const msUntilPublish = scheduledTime.getTime() - now.getTime();

      if (msUntilPublish > 0) {
        await step.sleep("wait-until-scheduled-time", msUntilPublish);
      }
    }

    // Step 3: Re-check post wasn't cancelled during wait
    await step.run("verify-not-cancelled", async () => {
      const current = await prisma.scheduledPost.findUnique({
        where: { id: scheduledPostId },
        select: { status: true },
      });

      if (current?.status === "CANCELLED") {
        throw new Error("Post was cancelled during wait period");
      }

      // Mark as PUBLISHING
      await prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: { status: "PUBLISHING", updatedAt: new Date() },
      });
    });

    // Step 4: Upload media to Zernio (fresh upload prevents URL expiration)
    const zernioMediaUrl = await step.run("upload-media-to-zernio", async () => {
      if (!post.mediaUrl) {
        throw new Error("No media URL found for post");
      }

      return await uploadMediaToZernio(
        post.mediaUrl,
        `${post.title.replace(/[^a-zA-Z0-9]/g, "_")}.mp4`
      );
    });

    // Step 5: Map platforms and accounts
    const platformsData = await step.run("map-platforms", async () => {
      const connectedAccounts = post.user.socialAccounts.filter((account) =>
        post.platforms.includes(account.platform)
      );

      if (connectedAccounts.length === 0) {
        throw new Error("No connected accounts found for selected platforms");
      }

      return connectedAccounts.map((account) => ({
        platform: PLATFORM_MAP[account.platform],
        accountId: account.zernioAccountId!,
      }));
    });

    // Step 6: Publish to Zernio NOW (not scheduled, since we already waited)
    const publishResult = await step.run("publish-to-zernio", async () => {
      return await publishPost({
        title: post.title,
        content: post.caption || undefined,
        mediaUrl: zernioMediaUrl,
        platforms: platformsData,
        publishNow: true, // Publish immediately since we already waited
      });
    });

    // Step 7: Update database - mark as PUBLISHED
    await step.run("mark-as-published", async () => {
      await prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          status: "PUBLISHED",
          zernioPostId: publishResult.postId,
          mediaUrl: zernioMediaUrl, // Store Zernio's permanent URL
          error: null,
          updatedAt: new Date(),
        },
      });
    });

    console.log(
      `[Publish] Successfully published scheduled post ${scheduledPostId} to ${post.platforms.join(", ")}`
    );

    return {
      success: true,
      scheduledPostId,
      zernioPostId: publishResult.postId,
      platforms: post.platforms,
    };
  }
);
