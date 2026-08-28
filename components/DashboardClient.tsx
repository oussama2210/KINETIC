"use client";

import React, { useState, useEffect } from "react";
import { UserProfile } from "@clerk/nextjs";
import { 
  Video, 
  Sparkles, 
  Share2, 
  Send, 
  Play, 
  CheckCircle2, 
  RefreshCw, 
  TrendingUp, 
  Calendar, 
  Download, 
  Film, 
  Eye, 
  Clock, 
  Check, 
  Database,
  Home,
  CreditCard,
  Settings,
  User,
  Plus,
  ArrowUpRight,
  Zap,
  Sliders,
  Key,
  Copy,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  AlertCircle,
  Radio,
  SlidersHorizontal,
  ChevronRight
} from "lucide-react";
import { useDashboard, DashboardTab } from "@/app/dashboard/DashboardContext";
import { VideoUploadZone } from "@/components/VideoUploadZone";

interface DbUserData {
  id?: string;
  clerkId?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  plan?: string;
  computeCredits?: number;
  apiKey?: string;
  videos?: Array<{
    id: string;
    title: string;
    videoUrl: string;
    duration: string;
    resolution: string;
    fps: number;
    published: boolean;
    channels: string[];
    createdAt: string | Date;
  }>;
  socialAccounts?: Array<{
    id: string;
    platform: string;
    handle: string;
    username?: string | null;
    zernioAccountId?: string | null;
    connected: boolean;
  }>;
}

interface ScheduledPostData {
  id: string;
  title: string;
  caption?: string | null;
  mediaUrl?: string | null;
  platforms: string[];
  scheduledFor?: string | Date | null;
  status: string;
  createdAt: string | Date;
}

interface GeneratedShortData {
  id: string;
  title: string;
  videoUrl?: string | null;
  renderedVideoUrl?: string | null;
  durationSec: number;
  viralityScore: number;
  renderStatus: string;
  projectId: string;
}

interface DashboardClientProps {
  initialDbUser: DbUserData | null;
  scheduledPosts?: ScheduledPostData[];
  generatedShorts?: GeneratedShortData[];
}

// Platform display metadata with real SVG icons
const PLATFORM_INFO: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  TIKTOK: { 
    name: "TikTok", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ), 
    color: "#00f2ea" 
  },
  REELS: { 
    name: "Instagram Reels", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ), 
    color: "#e4405f" 
  },
  SHORTS: { 
    name: "YouTube Shorts", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ), 
    color: "#ff0000" 
  },
  X: { 
    name: "X (Twitter)", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ), 
    color: "#ffffff" 
  },
  LINKEDIN: { 
    name: "LinkedIn", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ), 
    color: "#0077b5" 
  },
  FACEBOOK: { 
    name: "Facebook Reels", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ), 
    color: "#1877f2" 
  },
};

export function DashboardClient({ initialDbUser, scheduledPosts: initialScheduledPosts = [], generatedShorts: initialGeneratedShorts = [] }: DashboardClientProps) {
  const { activeTab, setActiveTab } = useDashboard();

  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPostData[]>(initialScheduledPosts);
  
  // Video Generator Form State
  const [prompt, setPrompt] = useState(
    "Hyper-lapse tracking shot through neon-drenched Neo-Tokyo alleyway in heavy rain, reflections on wet asphalt, volumetric steam, anamorphic 35mm lens."
  );
  const [camera, setCamera] = useState("Orbit Arc (3D)");
  const [aspectRatio, setAspectRatio] = useState("16:9 Landscape (YouTube)");
  const [fps, setFps] = useState("60fps");
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [copiedKey, setCopiedKey] = useState(false);
  const [apiKey] = useState(initialDbUser?.apiKey || "");
  const [newPostModal, setNewPostModal] = useState(false);

  // Scheduling form state
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleCaption, setScheduleCaption] = useState("");
  const [selectedVideo, setSelectedVideo] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Social connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  // Real social accounts from database
  const connectedAccounts = initialDbUser?.socialAccounts || [];
  
  // AI-generated shorts from database
  const [renders, setRenders] = useState(
    initialGeneratedShorts.map((short) => ({
      id: short.id,
      title: short.title,
      videoUrl: short.renderedVideoUrl || short.videoUrl || "",
      duration: `00:${String(Math.floor(short.durationSec)).padStart(2, "0")}`,
      format: `9:16 Vertical · ${short.viralityScore}/100 Score`,
      published: false,
      channels: [],
      time: short.renderStatus === "READY" ? "Ready" : short.renderStatus,
    }))
  );

  // Check for OAuth callback success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      const platform = params.get("platform");
      if (platform) {
        alert(`Successfully connected ${PLATFORM_INFO[platform]?.name || platform}!`);
        window.history.replaceState({}, "", "/dashboard?tab=connect-social");
      }
    }
    if (params.get("error")) {
      alert(`Connection error: ${params.get("error")}`);
      window.history.replaceState({}, "", "/dashboard?tab=connect-social");
    }
  }, []);

  const handleConnectPlatform = async (platform: string) => {
    setIsConnecting(true);
    setConnectError("");
    
    try {
      const response = await fetch("/api/social/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect");
      }

      // Redirect to Zernio OAuth URL
      window.location.href = data.authUrl;
    } catch (err: any) {
      setConnectError(err.message);
      setIsConnecting(false);
    }
  };

  const handleSchedulePost = async (publishNow: boolean = false) => {
    if (!scheduleTitle || !selectedVideo || selectedPlatforms.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    if (!publishNow && !scheduledDateTime) {
      alert("Please select a date and time for scheduling");
      return;
    }

    setIsScheduling(true);

    try {
      const response = await fetch("/api/social/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: scheduleTitle,
          caption: scheduleCaption,
          mediaUrl: selectedVideo,
          platforms: selectedPlatforms,
          scheduledFor: publishNow ? null : new Date(scheduledDateTime).toISOString(),
          publishNow,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule post");
      }

      // Add to local state
      setScheduledPosts((prev) => [data.post, ...prev]);

      // Reset form
      setScheduleTitle("");
      setScheduleCaption("");
      setSelectedVideo("");
      setSelectedPlatforms([]);
      setScheduledDateTime("");
      setNewPostModal(false);

      alert(publishNow ? "Post published successfully!" : "Post scheduled successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleGenerate = () => {
    setActiveTab("home");
    setTimeout(() => {
      document.getElementById("upload-zone")?.scrollIntoView({ behavior: "smooth" });
    }, 60);
  };

  const handleQuickPublish = (id: string) => {
    setRenders((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, published: true, channels: ["TikTok", "Reels", "Shorts", "X"] }
          : item
      )
    );
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const userPlan = initialDbUser?.plan || "STUDIO_PRO";
  const computeCredits = initialDbUser?.computeCredits ?? 600;
  const connectedCount = connectedAccounts.filter((a) => a.connected && a.zernioAccountId).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Status & Quick Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#23252a] pb-4">
        {/* Quick Section Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {[
            { id: "home", label: "Home", href: null },
            { id: "my-videos", label: "My Videos", href: null },
            { id: "schedule", label: "Schedule", href: "/dashboard/schedule" },
            { id: "connect-social", label: "Connect Social", href: null },
            { id: "account", label: "Account", href: null },
            { id: "settings", label: "Settings", href: null },
            { id: "profile", label: "Profile", href: null },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.href) {
                  window.location.href = tab.href;
                } else {
                  setActiveTab(tab.id as DashboardTab);
                }
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#161718] text-[#ffffff] border border-[#23252a] shadow-sm shadow-[#e4f222]/10"
                  : "text-[#8a8f98] hover:text-[#d0d6e0] hover:bg-[#121315]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Database & GPU Status Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="mono-badge text-[10px] text-[#e4f222]">
            {userPlan}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HOME */}
      {/* ========================================================================= */}
      {activeTab === "home" && (
        <div className="space-y-8 animate-in fade-in">
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-[#0f1011] via-[#121416] to-[#0f1011] border border-[#23252a] shadow-xl">
            <div>
              <h1 className="text-2xl sm:text-3xl font-[510] text-[#ffffff] tracking-tight">
                {initialDbUser?.firstName ? `Welcome back, ${initialDbUser.firstName}` : "Welcome to Kinetic"}
              </h1>
              <p className="text-xs text-[#8a8f98] mt-1 max-w-xl">
                Transform long videos into viral shorts with AI-powered moment detection and automated multi-platform publishing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setActiveTab("my-videos")}
                className="btn-acid-lime text-xs py-2.5 px-5 cursor-pointer shadow-[0_0_20px_rgba(228,242,34,0.3)] flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Shorts</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => setActiveTab("my-videos")}
              className="hairline-card p-4 space-y-1.5 cursor-pointer hover:border-[#383b3f] transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8a8f98] font-mono">
                <span>VIDEOS</span>
                <Video className="w-3.5 h-3.5 text-[#e4f222]" />
              </div>
              <div className="text-2xl font-mono font-[510] text-[#ffffff]">{renders.length}</div>
              <div className="text-[10px] text-[#27a644] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Ready to Publish</span>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab("connect-social")}
              className="hairline-card p-4 space-y-1.5 cursor-pointer hover:border-[#383b3f] transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8a8f98] font-mono">
                <span>PLATFORMS</span>
                <Share2 className="w-3.5 h-3.5 text-[#02b8cc]" />
              </div>
              <div className="text-2xl font-mono font-[510] text-[#02b8cc]">{connectedCount}</div>
              <div className="text-[10px] text-[#8a8f98]">
                {connectedCount === 0 ? "Connect accounts" : "Connected"}
              </div>
            </div>

            <div 
              onClick={() => window.location.href = "/dashboard/schedule"}
              className="hairline-card p-4 space-y-1.5 cursor-pointer hover:border-[#383b3f] transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8a8f98] font-mono">
                <span>SCHEDULED</span>
                <Calendar className="w-3.5 h-3.5 text-[#eb5757]" />
              </div>
              <div className="text-2xl font-mono font-[510] text-[#ffffff]">{scheduledPosts.length}</div>
              <div className="text-[10px] text-[#e4f222]">
                {scheduledPosts.length === 0 ? "No posts" : "In queue"}
              </div>
            </div>

            <div 
              onClick={() => setActiveTab("account")}
              className="hairline-card p-4 space-y-1.5 cursor-pointer hover:border-[#383b3f] transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8a8f98] font-mono">
                <span>CREDITS</span>
                <Zap className="w-3.5 h-3.5 text-[#27a644]" />
              </div>
              <div className="text-2xl font-mono font-[510] text-[#ffffff]">{computeCredits}</div>
              <div className="text-[10px] text-[#27a644]">Minutes remaining</div>
            </div>
          </div>

          {/* Video Upload Zone */}
          <div id="upload-zone">
            <VideoUploadZone 
              onVideoUploaded={(video) => {
                console.log("Video selected:", video.name);
              }}
              onGenerateShorts={(config) => {
                const activeVideoUrl = config.signedUrl || config.video.url;
                
                const newClip = {
                  id: `short-${Date.now()}`,
                  title: `AI Short: ${config.video.name.slice(0, 24)}`,
                  videoUrl: activeVideoUrl,
                  duration: "00:34",
                  format: "9:16 Vertical · Captions",
                  published: false,
                  channels: [],
                  time: "Processing",
                };

                setRenders(prev => [newClip, ...prev]);
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY VIDEOS */}
      {/* ========================================================================= */}
      {activeTab === "my-videos" && (
        <div className="space-y-8 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-[510] text-white tracking-tight flex items-center gap-2">
                <Video className="w-6 h-6 text-[#e4f222]" />
                <span>Video Library</span>
              </h2>
              <p className="text-xs text-[#8a8f98] mt-1">
                Your generated shorts ready for multi-platform distribution.
              </p>
            </div>
          </div>

          {renders.length === 0 ? (
            <div className="hairline-card p-12 text-center">
              <Video className="w-12 h-12 text-[#8a8f98] mx-auto mb-4" />
              <p className="text-sm text-[#8a8f98]">No videos yet. Upload a long video to generate shorts.</p>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                className="btn-acid-lime mt-4 text-xs py-2 px-4 cursor-pointer"
              >
                Go to Upload
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {renders.map((rnd) => (
                <div 
                  key={rnd.id}
                  className="hairline-card p-4 space-y-3 bg-[#0f1011] group hover:border-[#383b3f] transition-all"
                >
                  <div className="w-full aspect-video rounded-lg bg-[#161718] border border-[#23252a] overflow-hidden relative">
                    <video
                      src={rnd.videoUrl}
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-[#08090a]/80 backdrop-blur-sm border border-[#23252a] text-[10px] font-mono text-white">
                      {rnd.duration}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white truncate" title={rnd.title}>
                      {rnd.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8a8f98]">
                      <span>{rnd.format}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#23252a] flex items-center justify-between gap-2">
                    <a
                      href={`/api/video/download?shortId=${rnd.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded bg-[#161718] hover:bg-[#23252a] text-[#8a8f98] hover:text-white text-xs flex items-center gap-1 transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    {rnd.published ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#27a644] px-2.5 py-1 rounded bg-[#27a644]/10">
                        <Check className="w-3 h-3" />
                        <span>Published</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVideo(rnd.videoUrl);
                          setScheduleTitle(rnd.title);
                          setActiveTab("schedule");
                          setNewPostModal(true);
                        }}
                        className="flex-1 py-1.5 px-3 rounded bg-[#e4f222] hover:bg-[#ecf83e] text-[#08090a] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Schedule</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SCHEDULE */}
      {/* ========================================================================= */}
      {activeTab === "schedule" && (
        <div className="space-y-8 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-[510] text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-6 h-6 text-[#eb5757]" />
                <span>Content Scheduler</span>
              </h2>
              <p className="text-xs text-[#8a8f98] mt-1">
                Schedule posts across TikTok, Instagram Reels, YouTube Shorts, X, and more.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNewPostModal(!newPostModal)}
              className="btn-acid-lime text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Post</span>
            </button>
          </div>

          {/* New Post Scheduler Form */}
          {newPostModal && (
            <div className="hairline-card p-6 space-y-4 bg-[#0f1011]">
              <div className="flex items-center justify-between border-b border-[#23252a] pb-3">
                <h3 className="text-sm font-[510] text-white">Schedule New Post</h3>
                <button
                  type="button"
                  onClick={() => setNewPostModal(false)}
                  className="text-[#8a8f98] hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white block mb-1.5">Title</label>
                  <input
                    type="text"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    className="w-full bg-[#161718] border border-[#23252a] focus:border-[#e4f222] rounded-md p-2.5 text-xs text-[#ffffff] outline-none"
                    placeholder="Post title..."
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white block mb-1.5">Caption</label>
                  <textarea
                    rows={3}
                    value={scheduleCaption}
                    onChange={(e) => setScheduleCaption(e.target.value)}
                    className="w-full bg-[#161718] border border-[#23252a] focus:border-[#e4f222] rounded-md p-2.5 text-xs text-[#ffffff] outline-none resize-none"
                    placeholder="Add your caption..."
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white block mb-1.5">Select Video</label>
                  <select
                    value={selectedVideo}
                    onChange={(e) => setSelectedVideo(e.target.value)}
                    className="w-full bg-[#161718] border border-[#23252a] text-xs text-[#ffffff] rounded-md p-2.5 outline-none cursor-pointer"
                  >
                    <option value="">-- Choose a video --</option>
                    {renders.map((r) => (
                      <option key={r.id} value={r.videoUrl}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-white block mb-1.5">Select Platforms</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.keys(PLATFORM_INFO).map((platform) => {
                      const account = connectedAccounts.find((a) => a.platform === platform);
                      const isConnected = account?.connected && account?.zernioAccountId;
                      const isSelected = selectedPlatforms.includes(platform);

                      return (
                        <button
                          key={platform}
                          type="button"
                          disabled={!isConnected}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPlatforms((prev) => prev.filter((p) => p !== platform));
                            } else {
                              setSelectedPlatforms((prev) => [...prev, platform]);
                            }
                          }}
                          className={`p-3 rounded border text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#e4f222] border-[#e4f222] text-[#08090a]"
                              : isConnected
                              ? "bg-[#161718] border-[#23252a] text-white hover:border-[#e4f222]"
                              : "bg-[#0f1011] border-[#23252a] text-[#8a8f98] cursor-not-allowed"
                          }`}
                        >
                          {PLATFORM_INFO[platform].name}
                          {!isConnected && <span className="block text-[9px]">(Not connected)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-white block mb-1.5">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full bg-[#161718] border border-[#23252a] focus:border-[#e4f222] rounded-md p-2.5 text-xs text-[#ffffff] outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSchedulePost(false)}
                    disabled={isScheduling}
                    className="flex-1 btn-ghost py-2.5 text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isScheduling ? "Scheduling..." : "Schedule for Later"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSchedulePost(true)}
                    disabled={isScheduling}
                    className="flex-1 btn-acid-lime py-2.5 text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isScheduling ? "Publishing..." : "Post Now"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Posts Queue */}
          <div className="space-y-4">
            <h3 className="text-base font-[510] text-white">Scheduled Posts Queue</h3>

            {scheduledPosts.length === 0 ? (
              <div className="hairline-card p-8 text-center">
                <Calendar className="w-10 h-10 text-[#8a8f98] mx-auto mb-3" />
                <p className="text-sm text-[#8a8f98]">No scheduled posts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledPosts.map((post) => (
                  <div key={post.id} className="hairline-card p-4 bg-[#0f1011]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-medium text-white">{post.title}</h4>
                        {post.caption && (
                          <p className="text-xs text-[#8a8f98] line-clamp-2">{post.caption}</p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-[#8a8f98] font-mono">
                          <span>
                            {post.scheduledFor
                              ? new Date(post.scheduledFor).toLocaleString()
                              : "Published"}
                          </span>
                          <span>·</span>
                          <span>{post.platforms.join(", ")}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-2 py-1 rounded border ${
                          post.status === "PUBLISHED"
                            ? "text-[#27a644] bg-[#27a644]/10 border-[#27a644]/30"
                            : post.status === "SCHEDULED"
                            ? "text-[#02b8cc] bg-[#02b8cc]/10 border-[#02b8cc]/30"
                            : "text-[#eb5757] bg-[#eb5757]/10 border-[#eb5757]/30"
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
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONNECT SOCIAL */}
      {/* ========================================================================= */}
      {activeTab === "connect-social" && (
        <div className="space-y-8 animate-in fade-in">
          <div>
            <h2 className="text-2xl font-[510] text-white tracking-tight flex items-center gap-2">
              <Share2 className="w-6 h-6 text-[#02b8cc]" />
              <span>Connect Social Accounts</span>
            </h2>
            <p className="text-xs text-[#8a8f98] mt-1">
              Connect your social media accounts to enable automated publishing across platforms.
            </p>
          </div>

          {connectError && (
            <div className="hairline-card p-4 bg-[#eb5757]/10 border-[#eb5757]/30">
              <p className="text-xs text-[#eb5757]">{connectError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(PLATFORM_INFO).map((platform) => {
              const account = connectedAccounts.find((a) => a.platform === platform);
              const isConnected = account?.connected && account?.zernioAccountId;
              const info = PLATFORM_INFO[platform];

              return (
                <div key={platform} className="hairline-card p-5 bg-[#0f1011] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center border border-[#23252a]"
                        style={{ backgroundColor: `${info.color}15`, borderColor: `${info.color}30`, color: info.color }}
                      >
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-[510] text-white">{info.name}</h3>
                        {isConnected ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-[#8a8f98] font-mono">
                              {account.username || account.handle}
                            </p>
                            <span className="text-[9px] font-mono text-[#27a644] px-1.5 py-0.5 rounded bg-[#27a644]/10 border border-[#27a644]/30">
                              ✓ Connected
                            </span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-[#8a8f98] mt-0.5">Not connected</p>
                        )}
                      </div>
                    </div>

                    {!isConnected && (
                      <button
                        type="button"
                        onClick={() => handleConnectPlatform(platform)}
                        disabled={isConnecting}
                        className="text-xs px-3 py-1.5 rounded bg-[#e4f222] hover:bg-[#ecf83e] text-[#08090a] font-medium cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        {isConnecting ? "..." : "Connect"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ACCOUNT */}
      {/* ========================================================================= */}
      {activeTab === "account" && (
        <div className="space-y-8 animate-in fade-in">
          <div>
            <h2 className="text-2xl font-[510] text-white">Account & Billing</h2>
            <p className="text-xs text-[#8a8f98] mt-1">Manage your subscription and usage</p>
          </div>

          {/* Current Plan Card */}
          <div className="hairline-card p-6 bg-[#0f1011] space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-white">Current Plan</h3>
                <p className="text-2xl font-mono font-[510] text-[#e4f222]">{userPlan}</p>
                <p className="text-xs text-[#8a8f98]">
                  {userPlan === "CREATOR" && "Perfect for individuals getting started"}
                  {userPlan === "STUDIO_PRO" && "For serious creators & small teams"}
                  {userPlan === "ENTERPRISE" && "Custom solutions for agencies"}
                </p>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded bg-[#161718] hover:bg-[#23252a] text-white text-xs font-medium transition-colors border border-[#23252a]"
              >
                Upgrade Plan
              </button>
            </div>

            {/* Usage Stats */}
            <div className="pt-4 border-t border-[#23252a] space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#8a8f98]">Processing Minutes</span>
                  <span className="text-xs font-mono text-white">{computeCredits} / 600 min</span>
                </div>
                <div className="h-2 bg-[#161718] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#e4f222] rounded-full transition-all"
                    style={{ width: `${(computeCredits / 600) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#8a8f98] mt-1">
                  Resets on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded bg-[#161718] border border-[#23252a]">
                  <div className="text-[10px] text-[#8a8f98] mb-1">Videos Processed</div>
                  <div className="text-lg font-mono text-white">{renders.length}</div>
                </div>
                <div className="p-3 rounded bg-[#161718] border border-[#23252a]">
                  <div className="text-[10px] text-[#8a8f98] mb-1">Posts Published</div>
                  <div className="text-lg font-mono text-white">
                    {scheduledPosts.filter((p) => p.status === "PUBLISHED").length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div className="hairline-card p-6 bg-[#0f1011] space-y-4">
            <h3 className="text-sm font-medium text-white">Billing Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-[#23252a]">
                <div>
                  <p className="text-xs font-medium text-white">Email</p>
                  <p className="text-xs text-[#8a8f98] mt-0.5">{initialDbUser?.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[#23252a]">
                <div>
                  <p className="text-xs font-medium text-white">Account Created</p>
                  <p className="text-xs text-[#8a8f98] mt-0.5">
                    {initialDbUser?.createdAt
                      ? new Date(initialDbUser.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-medium text-white">Connected Platforms</p>
                  <p className="text-xs text-[#8a8f98] mt-0.5">{connectedCount} accounts</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("connect-social")}
                  className="text-xs text-[#e4f222] hover:underline"
                >
                  Manage →
                </button>
              </div>
            </div>
          </div>

          {/* Plan Comparison */}
          <div className="hairline-card p-6 bg-[#0f1011] space-y-4">
            <h3 className="text-sm font-medium text-white">Available Plans</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  name: "CREATOR",
                  price: "$29",
                  credits: "600 min/month",
                  features: ["3 videos/month", "All platforms", "AI captions"],
                },
                {
                  name: "STUDIO_PRO",
                  price: "$79",
                  credits: "2000 min/month",
                  features: ["Unlimited videos", "Priority processing", "Advanced analytics"],
                  current: userPlan === "STUDIO_PRO",
                },
                {
                  name: "ENTERPRISE",
                  price: "Custom",
                  credits: "Unlimited",
                  features: ["White-label", "API access", "Dedicated support"],
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`p-4 rounded-lg border transition-all ${
                    plan.current
                      ? "border-[#e4f222] bg-[#e4f222]/5"
                      : "border-[#23252a] bg-[#161718]"
                  }`}
                >
                  {plan.current && (
                    <span className="inline-block px-2 py-0.5 rounded bg-[#e4f222] text-[#08090a] text-[9px] font-mono font-bold mb-2">
                      CURRENT PLAN
                    </span>
                  )}
                  <h4 className="text-sm font-[510] text-white">{plan.name}</h4>
                  <p className="text-2xl font-mono text-[#e4f222] mt-2">{plan.price}</p>
                  <p className="text-[10px] text-[#8a8f98] mb-3">{plan.credits}</p>
                  <ul className="space-y-1.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-[#8a8f98] flex items-center gap-2">
                        <Check className="w-3 h-3 text-[#27a644]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {!plan.current && (
                    <button
                      type="button"
                      className="w-full mt-4 px-3 py-2 rounded bg-[#e4f222] hover:bg-[#ecf83e] text-[#08090a] text-xs font-medium transition-colors"
                    >
                      {plan.name === "ENTERPRISE" ? "Contact Sales" : "Upgrade"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="space-y-8 animate-in fade-in">
          <div>
            <h2 className="text-2xl font-[510] text-white">Settings</h2>
          </div>
          <div className="hairline-card p-6 bg-[#0f1011]">
            <p className="text-xs text-[#8a8f98]">Settings coming soon...</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PROFILE */}
      {/* ========================================================================= */}
      {activeTab === "profile" && (
        <div className="space-y-8 animate-in fade-in">
          <div>
            <h2 className="text-2xl font-[510] text-white">User Profile</h2>
            <p className="text-xs text-[#8a8f98] mt-1">Manage your Clerk user profile</p>
          </div>

          <div className="hairline-card overflow-hidden">
            <UserProfile
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent border-0 shadow-none",
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
