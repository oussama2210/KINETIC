import { checkAndSyncUser } from "@/lib/auth-sync";
import { currentUser } from "@clerk/nextjs/server";
import { DashboardClient } from "@/components/DashboardClient";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // 1. Check Clerk auth first (no DB hit)
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  // 2. Sync user with database
  const dbUser = await checkAndSyncUser();

  // 2. Fetch scheduled posts for the user
  let scheduledPosts: Array<{
    id: string;
    title: string;
    caption?: string | null;
    mediaUrl?: string | null;
    platforms: string[];
    scheduledFor?: Date | null;
    status: string;
    createdAt: Date;
  }> = [];
  
  // 3. Fetch AI-generated shorts (the real content)
  let generatedShorts: Array<{
    id: string;
    title: string;
    videoUrl?: string | null;
    renderedVideoUrl?: string | null;
    durationSec: number;
    viralityScore: number;
    renderStatus: string;
    projectId: string;
  }> = [];

  if (dbUser) {
    scheduledPosts = await prisma.scheduledPost.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    // Get all projects for this user, then get their shorts
    const projects = await prisma.project.findMany({
      where: { userId: dbUser.id },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    if (projects.length > 0) {
      generatedShorts = await prisma.generatedShort.findMany({
        where: {
          projectId: { in: projects.map((p) => p.id) },
        },
        select: {
          id: true,
          title: true,
          videoUrl: true,
          renderedVideoUrl: true,
          durationSec: true,
          viralityScore: true,
          renderStatus: true,
          projectId: true,
        },
        orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
        take: 50, // Limit to recent shorts
      });
    }
  }

  // 4. Render client dashboard with the fresh database user record
  return (
    <DashboardClient
      initialDbUser={dbUser}
      scheduledPosts={scheduledPosts}
      generatedShorts={generatedShorts}
    />
  );
}