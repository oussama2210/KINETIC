import { NextRequest, NextResponse } from "next/server";
import { fixedWindow } from "@arcjet/next";
import { aj } from "@/lib/arcjet";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest/client";

// Fire-and-forget endpoint: queues an Inngest render job and returns instantly.
// The heavy FFmpeg work happens in the background workflow, so there is no
// HTTP timeout risk. The UI polls /api/video/status until renderStatus = READY.
const ajExport = aj.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1h",
    max: 30,
  })
);

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const decision = await ajExport.protect(req);

    if (decision.isDenied()) {
      return NextResponse.json(
        { success: false, error: "Too many render requests — try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { shortId } = body;

    if (!shortId) {
      return NextResponse.json(
        { success: false, error: "Missing shortId" },
        { status: 400 }
      );
    }

    const short = await prisma.generatedShort.findUnique({
      where: { id: shortId },
      select: {
        id: true,
        title: true,
        renderStatus: true,
        renderedVideoUrl: true,
      },
    });

    if (!short) {
      return NextResponse.json(
        { success: false, error: "Short not found" },
        { status: 404 }
      );
    }

    // Already rendered — hand back the download URL immediately
    if (short.renderStatus === "READY" && short.renderedVideoUrl) {
      return NextResponse.json({
        success: true,
        shortId,
        renderStatus: "READY",
        downloadUrl: short.renderedVideoUrl,
      });
    }

    // Already queued/running — don't double-send the event
    if (short.renderStatus === "QUEUED" || short.renderStatus === "RENDERING") {
      return NextResponse.json({
        success: true,
        shortId,
        renderStatus: short.renderStatus,
      });
    }

    // Queue the background render job (returns immediately — no blocking)
    await inngest.send({
      name: "short/render.requested",
      data: { shortId },
    });

    await prisma.generatedShort.update({
      where: { id: shortId },
      data: { renderStatus: "QUEUED", renderError: null },
    });

    console.log(`[Export API] Queued Inngest render for short "${short.title}" (${shortId})`);

    return NextResponse.json({
      success: true,
      shortId,
      renderStatus: "QUEUED",
    });
  } catch (error: any) {
    console.error("[Export API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to queue render job",
      },
      { status: 500 }
    );
  }
}
