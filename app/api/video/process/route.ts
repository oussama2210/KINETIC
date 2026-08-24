import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";
import { getSupabaseUploadUrl, getSupabaseReadUrl, hasSupabaseConfig } from "@/lib/supabase";
import { getPresignedUploadUrl, getPresignedReadUrl, hasStorageCredentials } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const body = await req.json();

    const {
      fileName = "uploaded-raw-video.mp4",
      fileSize = "45.0 MB",
      duration = "04:18",
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
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `raw-videos/${userId}/${Date.now()}-${sanitizedFileName}`;

    let uploadUrl = "";
    let signedReadUrl = "";
    let bucketName = "videos";
    let isLiveStorage = false;

    // 2. Generate Supabase Storage upload and read URLs
    if (hasSupabaseConfig) {
      const sbStorage = await getSupabaseUploadUrl(storagePath);
      uploadUrl = sbStorage.uploadUrl;
      bucketName = sbStorage.bucket;
      isLiveStorage = sbStorage.isLiveStorage;
      signedReadUrl = await getSupabaseReadUrl(storagePath, bucketName);
    } else if (hasStorageCredentials) {
      // AWS S3 fallback
      const s3Storage = await getPresignedUploadUrl(storagePath, "video/mp4");
      uploadUrl = s3Storage.uploadUrl;
      bucketName = s3Storage.bucket;
      isLiveStorage = s3Storage.isLiveStorage;
      signedReadUrl = await getPresignedReadUrl(storagePath);
    } else {
      const sbStorage = await getSupabaseUploadUrl(storagePath);
      uploadUrl = sbStorage.uploadUrl;
      bucketName = sbStorage.bucket;
      isLiveStorage = false;
      signedReadUrl = await getSupabaseReadUrl(storagePath, bucketName);
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
          currentStep: "Project created in Supabase DB • Inngest workflow dispatched",
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

    // 4. Trigger Inngest Workflow function
    try {
      await inngest.send({
        name: "video/process.started",
        data: {
          projectId,
          userId,
          s3Key: storagePath,
          originalFileName: fileName,
          fileSize,
          clipCount,
          captionStyle,
          aspectRatio,
          detectHooks,
          autoBroll,
        },
      });
    } catch (inngestErr) {
      console.warn("Inngest send event note:", inngestErr);
    }

    return NextResponse.json({
      success: true,
      projectId,
      uploadUrl,
      isLiveStorage,
      signedUrl: signedReadUrl,
      s3Key: storagePath,
      bucket: bucketName,
      provider: "supabase",
      status: "UPLOADING",
      progress: 10,
      message: "Inngest video processing workflow triggered with Supabase backend",
    });
  } catch (error: any) {
    console.error("Video process API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start video processing workflow" },
      { status: 500 }
    );
  }
}
