"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Sparkles,
  Send,
  Clock,
  Video,
  Share2,
} from "lucide-react";

interface GeneratedShort {
  id: string;
  title: string;
  renderedVideoUrl?: string | null;
  videoUrl?: string | null;
  durationSec: number;
  viralityScore: number;
  transcriptExcerpt?: string | null;
  projectId: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  handle: string;
  username?: string | null;
  zernioAccountId?: string | null;
}

interface ScheduledPost {
  id: string;
  title: string;
  caption?: string | null;
  mediaUrl?: string | null;
  platforms: string[];
  scheduledFor?: Date | null;
  status: string;
  createdAt: Date;
}

interface ScheduleCalendarProps {
  user: any;
  generatedShorts: GeneratedShort[];
  socialAccounts: SocialAccount[];
  scheduledPosts: ScheduledPost[];
}

const PLATFORM_NAMES: Record<string, string> = {
  TIKTOK: "TikTok",
  REELS: "Instagram",
  SHORTS: "YouTube",
  X: "X",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
};

export function ScheduleCalendar({
  user,
  generatedShorts,
  socialAccounts,
  scheduledPosts: initialScheduledPosts,
}: ScheduleCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("12:00");

  // Form state
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const [scheduledPosts, setScheduledPosts] = useState(initialScheduledPosts);

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowDialog(true);
    setSelectedVideoId("");
    setSelectedPlatforms([]);
    setGeneratedCaption("");
  };

  // Get posts for a specific date
  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter((post) => {
      if (!post.scheduledFor) return false;
      const postDate = new Date(post.scheduledFor);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // AI Caption Generation
  const handleGenerateCaption = async () => {
    if (!selectedVideoId) return;

    const video = generatedShorts.find((v) => v.id === selectedVideoId);
    if (!video) return;

    setIsGeneratingCaption(true);

    try {
      const response = await fetch("/api/ai/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: video.title,
          transcript: video.transcriptExcerpt,
          platforms: selectedPlatforms,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedCaption(data.caption);
      } else {
        // Fallback caption
        setGeneratedCaption(
          `${video.title}\n\n🔥 Watch till the end!\n\n#viral #trending #shorts #reels #fyp`
        );
      }
    } catch (err) {
      // Fallback caption
      setGeneratedCaption(
        `${video.title}\n\n🔥 Watch till the end!\n\n#viral #trending #shorts #reels #fyp`
      );
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  // Schedule Post
  const handleSchedulePost = async () => {
    if (!selectedVideoId || !selectedDate || selectedPlatforms.length === 0) {
      alert("Please select a video, date/time, and at least one platform");
      return;
    }

    const video = generatedShorts.find((v) => v.id === selectedVideoId);
    if (!video) return;

    const videoUrl = video.renderedVideoUrl || video.videoUrl;
    if (!videoUrl) {
      alert("Video URL not available");
      return;
    }

    // Combine date and time
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    setIsScheduling(true);

    try {
      const response = await fetch("/api/social/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: video.title,
          caption: generatedCaption,
          mediaUrl: videoUrl,
          platforms: selectedPlatforms,
          scheduledFor: scheduledDateTime.toISOString(),
          publishNow: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule post");
      }

      // Add to local state
      setScheduledPosts((prev) => [data.post, ...prev]);

      // Close dialog
      setShowDialog(false);
      alert("Post scheduled successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsScheduling(false);
    }
  };

  const days = getCalendarDays();
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-[#08090a] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-[510] text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-[#e4f222]" />
              <span>Content Calendar</span>
            </h1>
            <p className="text-sm text-[#8a8f98] mt-1">
              Schedule your shorts across all platforms
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-xs px-4 py-2 rounded bg-[#161718] hover:bg-[#23252a] text-[#8a8f98] hover:text-white transition-colors border border-[#23252a]"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between hairline-card p-4">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded hover:bg-[#161718] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-[510]">{monthName}</h2>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded hover:bg-[#161718] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="hairline-card p-6 bg-[#0f1011]">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-[#8a8f98] py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const postsOnDay = getPostsForDate(date);
              const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
              const isPast = date < today;

              return (
                <div
                  key={date.toISOString()}
                  className={`group relative aspect-square rounded-lg border transition-all ${
                    isPast
                      ? "border-[#23252a] bg-[#0a0b0c] opacity-50"
                      : "border-[#23252a] bg-[#161718] hover:border-[#e4f222] hover:bg-[#1a1b1d] cursor-pointer"
                  } ${isToday ? "ring-2 ring-[#e4f222]" : ""}`}
                  onClick={() => !isPast && handleDayClick(date)}
                >
                  {/* Day Number */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`text-sm font-medium ${
                        isToday ? "text-[#e4f222]" : "text-white"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Posts Indicator */}
                  {postsOnDay.length > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#e4f222] text-[#08090a] text-[10px] font-bold">
                        {postsOnDay.length}
                      </span>
                    </div>
                  )}

                  {/* Add Post Button (on hover) */}
                  {!isPast && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1 text-xs text-[#e4f222] font-medium">
                        <Plus className="w-4 h-4" />
                        <span>Add Post</span>
                      </div>
                    </div>
                  )}

                  {/* Scheduled Posts Preview */}
                  {postsOnDay.length > 0 && (
                    <div className="absolute bottom-2 left-2 right-2 space-y-1">
                      {postsOnDay.slice(0, 2).map((post) => (
                        <div
                          key={post.id}
                          className="text-[9px] text-[#8a8f98] truncate bg-[#08090a] px-1 py-0.5 rounded"
                        >
                          {post.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Posts List */}
        <div className="hairline-card p-6 bg-[#0f1011] space-y-4">
          <h3 className="text-lg font-[510] text-white">Upcoming Posts</h3>
          
          {scheduledPosts.length === 0 ? (
            <p className="text-sm text-[#8a8f98]">No scheduled posts yet</p>
          ) : (
            <div className="space-y-3">
              {scheduledPosts.slice(0, 5).map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-3 rounded bg-[#161718] border border-[#23252a]"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white">{post.title}</h4>
                    <p className="text-xs text-[#8a8f98] mt-0.5">
                      {post.scheduledFor
                        ? new Date(post.scheduledFor).toLocaleString()
                        : "No date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8a8f98]">
                      {post.platforms.join(", ")}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-1 rounded ${
                        post.status === "SCHEDULED"
                          ? "bg-[#02b8cc]/10 text-[#02b8cc] border border-[#02b8cc]/30"
                          : "bg-[#27a644]/10 text-[#27a644] border border-[#27a644]/30"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Post Dialog */}
      {showDialog && selectedDate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1011] border border-[#23252a] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#23252a]">
              <div>
                <h3 className="text-lg font-[510] text-white">Schedule Post</h3>
                <p className="text-xs text-[#8a8f98] mt-1">
                  {selectedDate.toLocaleDateString("default", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="p-2 rounded hover:bg-[#161718] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 space-y-6">
              {/* Select Video */}
              <div>
                <label className="text-sm font-medium text-white block mb-2">
                  Select Video
                </label>
                {generatedShorts.length === 0 ? (
                  <p className="text-xs text-[#8a8f98]">No videos available. Generate some shorts first.</p>
                ) : (
                  <select
                    value={selectedVideoId}
                    onChange={(e) => setSelectedVideoId(e.target.value)}
                    className="w-full bg-[#161718] border border-[#23252a] text-sm text-white rounded-md p-3 outline-none cursor-pointer"
                  >
                    <option value="">-- Choose a video --</option>
                    {generatedShorts.map((video) => (
                      <option key={video.id} value={video.id}>
                        {video.title} ({Math.floor(video.durationSec)}s • Score: {video.viralityScore}/100)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Select Platforms */}
              <div>
                <label className="text-sm font-medium text-white block mb-2">
                  Select Platforms
                </label>
                {socialAccounts.length === 0 ? (
                  <p className="text-xs text-[#8a8f98]">
                    No connected accounts. Go to Connect Social to add accounts.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {socialAccounts.map((account) => {
                      const isSelected = selectedPlatforms.includes(account.platform);
                      return (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPlatforms((prev) =>
                                prev.filter((p) => p !== account.platform)
                              );
                            } else {
                              setSelectedPlatforms((prev) => [...prev, account.platform]);
                            }
                          }}
                          className={`p-3 rounded border text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-[#e4f222] border-[#e4f222] text-[#08090a]"
                              : "bg-[#161718] border-[#23252a] text-white hover:border-[#e4f222]"
                          }`}
                        >
                          {PLATFORM_NAMES[account.platform] || account.platform}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI Generate Caption Button */}
              {selectedVideoId && selectedPlatforms.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={handleGenerateCaption}
                    disabled={isGeneratingCaption}
                    className="w-full py-2.5 rounded bg-[#e4f222] hover:bg-[#ecf83e] text-[#08090a] text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingCaption ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#08090a]/30 border-t-[#08090a] rounded-full animate-spin" />
                        <span>Generating Caption...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>AI Generate Caption & Hashtags</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="text-sm font-medium text-white block mb-2">
                  Caption
                </label>
                <textarea
                  rows={5}
                  value={generatedCaption}
                  onChange={(e) => setGeneratedCaption(e.target.value)}
                  className="w-full bg-[#161718] border border-[#23252a] text-sm text-white rounded-md p-3 outline-none resize-none focus:border-[#e4f222] transition-colors"
                  placeholder="Add your caption with hashtags..."
                />
              </div>

              {/* Time Picker */}
              <div>
                <label className="text-sm font-medium text-white block mb-2">
                  Post Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-[#161718] border border-[#23252a] text-sm text-white rounded-md p-3 outline-none focus:border-[#e4f222] transition-colors"
                />
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex gap-3 p-6 border-t border-[#23252a]">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="flex-1 py-2.5 rounded bg-[#161718] hover:bg-[#23252a] text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSchedulePost}
                disabled={
                  isScheduling ||
                  !selectedVideoId ||
                  selectedPlatforms.length === 0 ||
                  !generatedCaption
                }
                className="flex-1 py-2.5 rounded bg-[#e4f222] hover:bg-[#ecf83e] text-[#08090a] text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScheduling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#08090a]/30 border-t-[#08090a] rounded-full animate-spin" />
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Schedule Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
