/**
 * GET /api/video/download?shortId=xxx
 * 
 * Generates a fresh signed URL and redirects directly to it.
 * This is much faster than proxying (no server transfer).
 * 
 * Signed URLs are valid for 1 hour and downloaded directly from Supabase Storage.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseReadUrl, hasSupabaseConfig } from "@/lib/supabase";
import { getPresignedReadUrl, hasStorageCredentials } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shortId = searchParams.get("shortId");

    if (!shortId) {
      return NextResponse.json({ error: "Missing shortId" }, { status: 400 });
    }

    // Fetch the short from database
    const short = await prisma.generatedShort.findUnique({
      where: { id: shortId },
      select: {
        title: true,
        renderedVideoUrl: true,
        videoUrl: true,
        project: { 
          select: { 
            s3Key: true,
            s3Bucket: true,
            signedUrl: true 
          } 
        },
      },
    });

    if (!short) {
      return NextResponse.json({ error: "Short not found" }, { status: 404 });
    }

    // Get the storage key (path in bucket)
    let storageKey = "";
    
    // Priority: renderedVideoUrl (the final FFmpeg output)
    if (short.renderedVideoUrl) {
      try {
        const url = new URL(short.renderedVideoUrl);
        // Extract key from Supabase URL format:
        // https://xxx.supabase.co/storage/v1/object/sign/bucket-name/path/to/file.mp4?token=...
        // https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.mp4
        const match = url.pathname.match(/\/storage\/v1\/object\/(?:sign|public)\/[^/]+\/(.+)$/);
        if (match && match[1]) {
          storageKey = match[1].split("?")[0]; // Remove query params
        }
      } catch (e) {
        console.warn("[Download] Could not parse renderedVideoUrl:", e);
      }
    }
    
    // Fallback 1: Try videoUrl
    if (!storageKey && short.videoUrl) {
      try {
        const url = new URL(short.videoUrl);
        const match = url.pathname.match(/\/storage\/v1\/object\/(?:sign|public)\/[^/]+\/(.+)$/);
        if (match && match[1]) {
          storageKey = match[1].split("?")[0];
        }
      } catch (e) {
        console.warn("[Download] Could not parse videoUrl:", e);
      }
    }
    
    // Fallback 2: Use s3Key directly
    if (!storageKey && short.project.s3Key) {
      storageKey = short.project.s3Key;
    }

    if (!storageKey) {
      console.error("[Download] No storage key found:", {
        hasRenderedUrl: !!short.renderedVideoUrl,
        hasVideoUrl: !!short.videoUrl,
        hasS3Key: !!short.project.s3Key,
        renderedUrl: short.renderedVideoUrl?.slice(0, 100),
        videoUrl: short.videoUrl?.slice(0, 100),
        s3Key: short.project.s3Key,
      });
      return NextResponse.json(
        { error: "No video available for download" },
        { status: 404 }
      );
    }

    console.log("[Download] Using storage key:", storageKey);

    // Generate fresh signed URL (valid for 1 hour)
    let downloadUrl = "";
    
    if (hasSupabaseConfig) {
      console.log("[Download] Using Supabase for key:", storageKey);
      const result = await getSupabaseReadUrl(storageKey);
      downloadUrl = result.signedUrl;
    } else if (hasStorageCredentials) {
      console.log("[Download] Using S3 for key:", storageKey);
      const result = await getPresignedReadUrl(storageKey);
      downloadUrl = result.signedUrl;
    } else {
      // Fallback to existing URL if no storage config
      console.log("[Download] No storage config, using existing URL");
      downloadUrl = short.renderedVideoUrl || short.videoUrl || short.project.signedUrl || "";
    }

    if (!downloadUrl) {
      console.error("[Download] Could not generate signed URL:", {
        hasSupabaseConfig,
        hasStorageCredentials,
        storageKey,
      });
      return NextResponse.json(
        { error: "Could not generate download URL" },
        { status: 500 }
      );
    }

    console.log("[Download] Generated URL successfully, redirecting...");

    // Redirect directly to the signed URL with download header
    // The browser will download directly from Supabase (much faster!)
    const cleanTitle = (short.title || "short").replace(/[^a-zA-Z0-9_\- ]/g, "_");
    const filename = `${cleanTitle}.mp4`;
    
    // Use 302 temporary redirect (don't cache)
    const response = NextResponse.redirect(downloadUrl, 302);
    
    // Set filename suggestion (works in most browsers)
    response.headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    
    return response;
  } catch (error) {
    console.error("[Download API Error]:", error);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
