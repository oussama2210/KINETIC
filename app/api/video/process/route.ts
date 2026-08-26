import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseUploadUrl, hasSupabaseConfig } from "@/lib/supabase";
import { getPresignedUploadUrl, hasStorageCredentials } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    // Clerk's backend can be transiently unreachable (fetch failed / proxy).
    // Don't 500 the whole upload flow because of it — fall back to the
    // demo user path below instead.
    let user: Awaited<ReturnType<typeof currentUser>> = null;
    try {
      user = await currentUser();
    } catch (clerkErr) {
      console.warn("Clerk currentUser() unavailable, using demo user fallback:", clerkErr);
      user = null;
    }
    const body = await req.json();

    const {
      fileName = "uploaded-raw-video.mp4",
      fileSize = "45.0 MB",
      duration = "04:18",
      videoUrl,
      clipCount = "3-5 Viral Shorts",
      captionStyle = "Hormozi Style (Dynamic Neon)",
      aspectRatio = "9:16 Vertical",
      detectHooks = true,
      autoBroll = true,
    } = body;

    // 1. Ensure user exists in Supabase Database or fallback to dev user
    let dbUser = null;
    if (user) {
      dbUser = await prisma.user.upsert({
        where: { clerkId: user.id },
        update: {},
        create: {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || `${user.id}@aivideo.studio`,
          firstName: user.firstName || "Director",
          lastName: user.lastName || "User",
          imageUrl: user.imageUrl,
          plan: "STUDIO_PRO",
          computeCredits: 600,
        },
      });
    } else {
      // Find or create default demo user for development preview
      dbUser = await prisma.user.upsert({
        where: { clerkId: "demo-clerk-id" },
        update: {},
        create: {
          clerkId: "demo-clerk-id",
          email: "director@aivideo.studio",
          firstName: "Studio",
          lastName: "Director",
          plan: "STUDIO_PRO",
          computeCredits: 600,
        },
      });
    }

    const userId = dbUser.id;
    const isDirectUrl = Boolean(videoUrl && (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")));
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = isDirectUrl ? videoUrl : `raw-videos/${userId}/${Date.now()}-${sanitizedFileName}`;

    let uploadUrl = "";
    let signedReadUrl = isDirectUrl ? videoUrl : "";
    let bucketName = "videos";
    let isLiveStorage = isDirectUrl;
    let uploadToken: string | undefined;
    let storageApiKey: string | undefined;

    // 2. Generate Supabase Storage UPLOAD URL only if this is a file upload (not a direct URL)
    if (!isDirectUrl) {
      if (hasSupabaseConfig) {
        const sbStorage = await getSupabaseUploadUrl(storagePath);
        uploadUrl = sbStorage.uploadUrl;
        bucketName = sbStorage.bucket;
        isLiveStorage = sbStorage.isLiveStorage;
        uploadToken = sbStorage.token;
        storageApiKey = sbStorage.apiKey;
      } else if (hasStorageCredentials) {
        // AWS S3 fallback
        const s3Storage = await getPresignedUploadUrl(storagePath, "video/mp4");
        uploadUrl = s3Storage.uploadUrl;
        bucketName = s3Storage.bucket;
        isLiveStorage = s3Storage.isLiveStorage;
      } else {
        const sbStorage = await getSupabaseUploadUrl(storagePath);
        uploadUrl = sbStorage.uploadUrl;
        bucketName = sbStorage.bucket;
        isLiveStorage = false;
        uploadToken = sbStorage.token;
        storageApiKey = sbStorage.apiKey;
      }
    }

    // 3. Create Project record in Supabase PostgreSQL Database (via Prisma)
    let project = null;
    try {
      project = await prisma.project.create({
        data: {
          userId,
          title: `Project: ${fileName}`,
          originalFileName: fileName,
          fileSize,
          duration,
          s3Key: storagePath,
          s3Bucket: bucketName,
          signedUrl: signedReadUrl,
          status: "UPLOADING",
          progress: 10,
          currentStep: "Project created in Supabase DB • Waiting for raw video upload",
          clipCount,
          captionStyle,
          aspectRatio,
          detectHooks,
          autoBroll,
        },
      });
    } catch (dbErr) {
      console.warn("Prisma Project model error (fallback):", dbErr);
      project = {
        id: `prj_${Date.now()}`,
        userId,
        title: `Project: ${fileName}`,
        s3Key: storagePath,
        signedUrl: signedReadUrl,
        status: "UPLOADING",
        progress: 10,
        currentStep: "Project initialized in Supabase",
      };
    }

    const projectId = project.id;

    // NOTE: The Inngest workflow is NOT dispatched here anymore.
    // It is dispatched by /api/video/dispatch AFTER the client finishes
    // uploading the raw video to storage — otherwise long uploads race
    // the workflow and Deepgram/probes get 400s on a missing object.

    return NextResponse.json({
      success: true,
      projectId,
      uploadUrl,
      isLiveStorage,
      token: uploadToken,
      apiKey: storageApiKey,
      signedUrl: signedReadUrl,
      s3Key: storagePath,
      bucket: bucketName,
      provider: "supabase",
      status: "UPLOADING",
      progress: 10,
      message: "Project created — upload the video, then call /api/video/dispatch to start the Inngest workflow",
    });
  } catch (error: any) {
    console.error("Video process API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start video processing workflow" },
      { status: 500 }
    );
  }
}
