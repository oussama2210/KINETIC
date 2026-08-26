import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";

/**
 * Dispatches the Inngest processing workflow for a project.
 *
 * IMPORTANT: the client must only call this AFTER the raw video file is
 * 100% uploaded to storage. Dispatching earlier races the upload and makes
 * every storage probe / Deepgram fetch fail with 400 (object not found).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const projectId = body?.projectId as string | undefined;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Missing projectId" },
        { status: 400 }
      );
    }

    let project = null;
    try {
      project = await prisma.project.findUnique({
        where: { id: projectId },
      });
    } catch (dbErr) {
      console.warn("[Dispatch] Prisma project lookup failed:", dbErr);
    }

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Deterministic event id → Inngest dedupes accidental double-dispatches
    await inngest.send({
      id: `process-${project.id}`,
      name: "video/process.started",
      data: {
        projectId: project.id,
        userId: project.userId,
        s3Key: project.s3Key,
        originalFileName: project.originalFileName,
        fileSize: project.fileSize,
        clipCount: project.clipCount,
        captionStyle: project.captionStyle,
        aspectRatio: project.aspectRatio,
        detectHooks: project.detectHooks,
        autoBroll: project.autoBroll,
      },
    });

    console.log(`[Dispatch] Inngest workflow started for project ${project.id} (source: ${project.s3Key})`);

    return NextResponse.json({
      success: true,
      projectId: project.id,
      message: "Inngest video processing workflow dispatched",
    });
  } catch (error: any) {
    console.error("[Dispatch] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch workflow" },
      { status: 500 }
    );
  }
}
