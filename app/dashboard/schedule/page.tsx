import { checkAndSyncUser } from "@/lib/auth-sync";
import { ScheduleCalendar } from "@/components/ScheduleCalendar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function SchedulePage() {
  // Authenticate user
  const dbUser = await checkAndSyncUser();
  
  if (!dbUser) {
    redirect("/sign-in");
  }

  // Fetch user's generated shorts (AI-selected clips with rendered videos)
  const projects = await prisma.project.findMany({
    where: { 
      userId: dbUser.id,
      status: "COMPLETED"
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  const generatedShorts = projects.length > 0
    ? await prisma.generatedShort.findMany({
        where: {
          projectId: { in: projects.map((p) => p.id) },
          renderStatus: "READY"
        },
        select: {
          id: true,
          title: true,
          renderedVideoUrl: true,
          videoUrl: true,
          durationSec: true,
          viralityScore: true,
          transcriptExcerpt: true,
          projectId: true,
        },
        orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
        take: 100,
      })
    : [];

  // Fetch connected social accounts
  const socialAccounts = await prisma.socialAccount.findMany({
    where: {
      userId: dbUser.id,
      connected: true,
      zernioAccountId: { not: null },
    },
    select: {
      id: true,
      platform: true,
      handle: true,
      username: true,
      zernioAccountId: true,
    },
  });

  // Fetch existing scheduled posts
  const scheduledPosts = await prisma.scheduledPost.findMany({
    where: { userId: dbUser.id },
    select: {
      id: true,
      title: true,
      caption: true,
      mediaUrl: true,
      platforms: true,
      scheduledFor: true,
      status: true,
      createdAt: true,
    },
    orderBy: { scheduledFor: "asc" },
  });

  return (
    <ScheduleCalendar
      user={dbUser}
      generatedShorts={generatedShorts}
      socialAccounts={socialAccounts}
      scheduledPosts={scheduledPosts}
    />
  );
}
