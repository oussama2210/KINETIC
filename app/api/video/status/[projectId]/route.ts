import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    let project = null;
    try {
      project = await (prisma as any).project.findUnique({
        where: { id: projectId },
        include: {
          shorts: true,
          generatedShorts: {
            orderBy: { rank: "asc" },
          },
        },
      });
    } catch (e) {
      console.warn("Prisma project query fallback", e);
    }

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: any) {
    console.error("Fetch project status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch project status" },
      { status: 500 }
    );
  }
}
