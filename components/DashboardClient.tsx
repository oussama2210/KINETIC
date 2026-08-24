"use client";

import React, { useState } from "react";
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
    connected: boolean;
  }>;
}

interface DashboardClientProps {
  initialDbUser: DbUserData | null;
}

export function DashboardClient({ initialDbUser }: DashboardClientProps) {
  const { activeTab, setActiveTab } = useDashboard();

  // Video Generator Form State
  const [prompt, setPrompt] = useState(
    "Hyper-lapse tracking shot through neon-drenched Neo-Tokyo alleyway in heavy rain, reflections on wet asphalt, volumetric steam, anamorphic 35mm lens."
  );
  const [camera, setCamera] = useState("Orbit Arc (3D)");
  const [aspectRatio, setAspectRatio] = useState("16:9 Landscape (YouTube)");
  const [fps, setFps] = useState("60fps");
  const [motionIntensity, setMotionIntensity] = useState(85);
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [copiedKey, setCopiedKey] = useState(false);
  const [apiKey] = useState("kn_live_89f02934b1a40392ce817");
  const [newPostModal, setNewPostModal] = useState(false);

  // Social Channels Status State
  const [channels, setChannels] = useState([
    { id: "tiktok", name: "TikTok", handle: "@kinetic_studio", status: "Connected", icon: "♪", color: "#02b8cc", followers: "482.4K", engagement: "+4.8%" },
    { id: "reels", name: "Instagram Reels", handle: "@kinetic.motion", status: "Connected", icon: "📸", color: "#eb5757", followers: "218.1K", engagement: "+6.2%" },
    { id: "shorts", name: "YouTube Shorts", handle: "Kinetic Cinema", status: "Connected", icon: "▶", color: "#eb5757", followers: "690.0K", engagement: "+8.1%" },
    { id: "x", name: "X (Twitter)", handle: "@Kinetic_AI", status: "Connected", icon: "𝕏", color: "#ffffff", followers: "94.5K", engagement: "+3.4%" },
    { id: "linkedin", name: "LinkedIn", handle: "Kinetic AI Labs", status: "Ready to Connect", icon: "in", color: "#02b8cc", followers: "12.0K", engagement: "—" },
    { id: "facebook", name: "Facebook Reels", handle: "Kinetic Studio Page", status: "Ready to Connect", icon: "f", color: "#6366f1", followers: "45.2K", engagement: "—" },
  ]);

  // Video Renders List
  const [renders, setRenders] = useState(
    initialDbUser?.videos && initialDbUser.videos.length > 0
      ? initialDbUser.videos.map((v) => ({
          id: v.id,
          title: v.title,
          videoUrl: v.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
          duration: v.duration || "00:12",
          format: `${v.resolution || "4K"} · ${v.fps || 60}fps`,
          published: v.published,
          channels: v.channels?.length ? v.channels : ["TikTok", "Reels", "Shorts", "X"],
          time: "Synced from DB",
        }))
      : [
          {
            id: "rnd-1",
            title: "Cyberpunk Tokyo Rain (Master 4K)",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            duration: "00:12",
            format: "4K · 60fps (16:9 + 9:16)",
            published: true,
            channels: ["TikTok", "Reels", "Shorts", "X"],
            time: "10 mins ago",
          },
          {
            id: "rnd-2",
            title: "Molten Gold Dynamics 120fps",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            duration: "00:10",
            format: "4K · 120fps (9:16 Vertical)",
            published: false,
            channels: [],
            time: "2 hours ago",
          },
          {
            id: "rnd-3",
            title: "Orbital Space Habitat Velocity",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            duration: "00:16",
            format: "4K · 60fps (2.39:1 Cinema)",
            published: true,
            channels: ["YouTube Shorts", "X"],
            time: "Yesterday",
          },
        ]
  );

  // Scheduled Posts Queue
  const [scheduledPosts, setScheduledPosts] = useState([
    {
      id: "sch-1",
      title: "Cyberpunk Tokyo Rain (Director Cut)",
      scheduledTime: "Today at 18:00 UTC",
      platforms: ["TikTok", "Instagram Reels", "YouTube Shorts"],
      status: "Scheduled",
      aspect: "9:16 Vertical",
    },
    {
      id: "sch-2",
      title: "Molten Gold Fluid Mechanics Teaser",
      scheduledTime: "Tomorrow at 14:30 UTC",
      platforms: ["X (Twitter)", "YouTube Shorts"],
      status: "Queued",
      aspect: "16:9 Landscape",
    },
    {
      id: "sch-3",
      title: "Hyper-speed Neon Drift Sequence",
      scheduledTime: "Friday at 20:00 UTC",
      platforms: ["TikTok", "Instagram Reels"],
      status: "Queued",
      aspect: "9:16 Vertical",
    },
  ]);

  const handleGenerate = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setRenderProgress(0);

    const interval = setInterval(() => {
      setRenderProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          const newVideo = {
            id: `rnd-${Date.now()}`,
            title: prompt.slice(0, 36) + "...",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            duration: "00:12",
            format: `4K · ${fps} (${aspectRatio.split(" ")[0]})`,
            published: false,
            channels: [],
            time: "Just now",
          };
          setRenders(prevList => [newVideo, ...prevList]);
          return 100;
        }
        return prev + 20;
      });
    }, 400);
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

  const handleToggleChannel = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channelId
          ? {
              ...ch,
              status: ch.status === "Connected" ? "Disconnected" : "Connected",
            }
          : ch
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Status & Quick Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#23252a] pb-4">
        {/* Quick Section Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {[
            { id: "home", label: "Home" },
            { id: "my-videos", label: "My Video" },
            { id: "schedule", label: "Schedule" },
            { id: "connect-social", label: "Connect Social" },
            { id: "account", label: "Account" },
            { id: "settings", label: "Settings" },
            { id: "profile", label: "Profile" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DashboardTab)}
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0f1011] border border-[#23252a] text-[11px] font-mono text-[#27a644]">
            <Database className="w-3.5 h-3.5 text-[#27a644]" />
            <span>Supabase DB Synced</span>
          </span>
          <span className="mono-badge text-[10px] text-[#e4f222]">
            Plan: {userPlan}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HOME (Overview, Metrics, Quick Launch) */}
      {/* ========================================================================= */}
      {activeTab === "home" && (
        <div className="space-y-8 animate-in fade-in">
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-[#0f1011] via-[#121416] to-[#0f1011] border border-[#23252a] shadow-xl">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#e4f222] mb-1">
                <span className="w-2 h-2 rounded-full bg-[#e4f222] animate-ping"></span>
                <span>H100 COMPUTE CLUSTER ONLINE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-[510] text-[#ffffff] tracking-tight">
                {initialDbUser?.firstName ? `Welcome back, ${initialDbUser.firstName}` : "Director Studio Workspace"}
              </h1>
              <p className="text-xs text-[#8a8f98] mt-1 max-w-xl">
                Real-time 4K cinematic video engine with direct automated distribution across TikTok, Instagram Reels, YouTube Shorts, and X.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setActiveTab("my-videos")}
                className="btn-acid-lime text-xs py-2.5 px-5 cursor-pointer shadow-[0_0_20px_rgba(228,242,34,0.3)] flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Video Studio</span>
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
                <span>MY VIDEOS</span>
                <Video className="w-3.5 h-3.5 text-[#e4f222]" />
              </div>
              <div className="text-2xl font-mono font-[510] text-[#ffffff]">{renders.length} Renders</div>
              <div className="text-[10px] text-[#27a644] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>4K Master Coherence</span>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab("connect-social")}
              className="hairline-card p-4 space-y-1.5 cursor-pointer hover:border-[#383b3f] transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8a8f98] font-mono">
                <span>CONNECTED SOCIAL</span>
                <Share2 className="w-3.5 h-3.5 text-[#02b8cc]" />
              </div>
              <div className="text-2xl font-mono font-[510] text-[#02b8cc]">
                {channels.filter(c => c.status === "Connected").length} Channels
              </div>
              <div className="text-[10px] text-[#8a8f98]">TikTok, Reels, Shorts, X</div>
            </div>

            <div 
              onClick={() => setActiveTab("schedule")}
              className="hairline-card p-4 space-y-1.5 cursor-pointer hover:border-[#383b3f] transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8a8f98] font-mono">
                <span>SCHEDULE QUEUE</span>
                <Calendar className="w-3.5 h-3.5 text-[#eb5757]" />
              </div>
              <div className="text-2xl font-mono font-[510] text-[#ffffff]">{scheduledPosts.length} Posts</div>
              <div className="text-[10px] text-[#e4f222]">Next drop: Today 18:00 UTC</div>
            </div>

            <div 
              onClick={() => setActiveTab("account")}
              className="hairline-card p-4 space-y-1.5 cursor-pointer hover:border-[#383b3f] transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8a8f98] font-mono">
                <span>GPU COMPUTE</span>
                <Zap className="w-3.5 h-3.5 text-[#27a644]" />
              </div>
              <div className="text-2xl font-mono font-[510] text-[#ffffff]">{computeCredits} min</div>
              <div className="text-[10px] text-[#27a644]">H100 Cluster Ready</div>
            </div>
          </div>

          {/* Primary Video Upload Zone for AI Shorts & Subtitles Generation */}
          <VideoUploadZone 
            onVideoUploaded={(video) => {
              console.log("Video selected:", video.name);
            }}
            onGenerateShorts={(config) => {
              const activeVideoUrl = config.signedUrl || config.video.url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
              
              const newClip = {
                id: `short-${Date.now()}`,
                title: `AI Short: ${config.video.name.slice(0, 24)} (Hook #1)`,
                videoUrl: activeVideoUrl,
                duration: "00:34",
                format: "9:16 Vertical · Dynamic Transcripts",
                published: false,
                channels: [],
                time: "Inggest S3 Processed",
              };

              setRenders(prev => [newClip, ...prev]);

              // Add to schedule queue
              setScheduledPosts(prev => [
                {
                  id: `sch-${Date.now()}`,
                  title: `AI Short: ${config.video.name.slice(0, 24)} (Inggest Auto-Cut)`,
                  scheduledTime: "Today at 19:00 UTC",
                  platforms: ["TikTok", "Instagram Reels", "YouTube Shorts"],
                  status: "Queued",
                  aspect: "9:16 Vertical",
                },
                ...prev
              ]);
            }}
          />

          {/* Quick Studio & Recent Renders Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Quick Synthesizer (7 cols) */}
            <div className="lg:col-span-7 hairline-card p-6 space-y-4 bg-[#0f1011]">
              <div className="flex items-center justify-between border-b border-[#23252a] pb-3">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#e4f222]" />
                  <h3 className="text-sm font-[510] text-white">Instant 4K Synthesizer</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("my-videos")}
                  className="text-[11px] text-[#e4f222] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Studio</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                <textarea
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-[#161718] border border-[#23252a] focus:border-[#e4f222] rounded-md p-3 text-xs text-[#ffffff] outline-none resize-none transition-colors"
                  placeholder="Describe your scene trajectory..."
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="p-2 rounded bg-[#161718] border border-[#23252a] text-[11px]">
                    <span className="text-[#8a8f98] block text-[10px]">Camera:</span>
                    <span className="text-white font-medium">{camera}</span>
                  </div>
                  <div className="p-2 rounded bg-[#161718] border border-[#23252a] text-[11px]">
                    <span className="text-[#8a8f98] block text-[10px]">Format:</span>
                    <span className="text-[#e4f222] font-mono">{aspectRatio.split(" ")[0]}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex items-center">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="btn-acid-lime w-full py-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{renderProgress}%</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Generate 4K</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Upcoming Scheduled Drops (5 cols) */}
            <div className="lg:col-span-5 hairline-card p-6 space-y-4 bg-[#0f1011]">
              <div className="flex items-center justify-between border-b border-[#23252a] pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#eb5757]" />
                  <h3 className="text-sm font-[510] text-white">Upcoming Drops</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("schedule")}
                  className="text-[11px] text-[#8a8f98] hover:text-white transition-colors cursor-pointer"
                >
                  View Calendar
                </button>
              </div>

              <div className="space-y-2.5">
                {scheduledPosts.slice(0, 2).map((post) => (
                  <div key={post.id} className="p-3 rounded-lg bg-[#08090a] border border-[#23252a] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white truncate max-w-[180px]">{post.title}</span>
                      <span className="text-[9px] font-mono text-[#02b8cc] bg-[#02b8cc]/10 px-1.5 py-0.5 rounded border border-[#02b8cc]/30">
                        {post.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#8a8f98] font-mono">
                      <span>{post.scheduledTime}</span>
                      <span className="text-[#e4f222]">{post.platforms.join(", ")}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className="btn-ghost w-full justify-center py-2 text-xs cursor-pointer"
              >
                + Schedule Campaign Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY VIDEO (Full 4K Video Studio & Render Library) */}
      {/* ========================================================================= */}
      {activeTab === "my-videos" && (
        <div className="space-y-8 animate-in fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-[510] text-white tracking-tight flex items-center gap-2">
                <Video className="w-6 h-6 text-[#e4f222]" />
                <span>My Video Studio &amp; Render Library</span>
              </h2>
              <p className="text-xs text-[#8a8f98] mt-1">
                Synthesize 4K UHD photorealistic video sequences with continuous camera control and automated multi-aspect reframing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="mono-badge text-[10px] text-[#27a644]">
                GPU Load: 14%
              </span>
            </div>
          </div>

          {/* Full Studio Synthesizer Panel */}
          <div className="hairline-card p-6 space-y-6 bg-[#0f1011]">
            <div className="flex items-center justify-between border-b border-[#23252a] pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#e4f222]" />
                <h3 className="text-sm font-[510] text-white">Prompt Director &amp; 6-DoF Camera Control</h3>
              </div>
              <span className="text-[11px] font-mono text-[#8a8f98]">H100 Tensor Core v3.4</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white block mb-1.5">
                  Generative Scene Prompt
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-[#161718] border border-[#23252a] focus:border-[#e4f222] rounded-lg p-3.5 text-xs text-[#ffffff] outline-none font-sans resize-none transition-colors"
                  placeholder="Describe lighting, camera trajectory, motion dynamics, subject detail..."
                />
              </div>

              {/* Parameter Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-[11px] text-[#8a8f98] block mb-1.5">Camera Trajectory (6-DoF)</label>
                  <select
                    value={camera}
                    onChange={(e) => setCamera(e.target.value)}
                    className="w-full bg-[#161718] border border-[#23252a] text-xs text-[#ffffff] rounded-md p-2.5 outline-none cursor-pointer"
                  >
                    <option>Orbit Arc (3D)</option>
                    <option>Dolly Zoom (Vertigo)</option>
                    <option>Crane Pan Left</option>
                    <option>FPV High-Speed Dive</option>
                    <option>Bullet Time 360 Spin</option>
                    <option>Low-Angle Forward Push</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#8a8f98] block mb-1.5">Master Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full bg-[#161718] border border-[#23252a] text-xs text-[#ffffff] rounded-md p-2.5 outline-none font-mono cursor-pointer"
                  >
                    <option>16:9 Landscape (YouTube)</option>
                    <option>9:16 Vertical (TikTok / Reels)</option>
                    <option>1:1 Square (X / LinkedIn)</option>
                    <option>2.39:1 Anamorphic Scope</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#8a8f98] block mb-1.5">Temporal Frame Rate</label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(e.target.value)}
                    className="w-full bg-[#161718] border border-[#23252a] text-xs text-[#ffffff] rounded-md p-2.5 outline-none font-mono cursor-pointer"
                  >
                    <option>60fps (Standard Cinematic)</option>
                    <option>120fps (High-Motion Fluid)</option>
                    <option>24fps (Film Noir Standard)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="btn-acid-lime w-full py-2.5 text-xs font-medium cursor-pointer shadow-[0_0_15px_rgba(228,242,34,0.2)] flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#08090a]" />
                        <span>Synthesizing ({renderProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#08090a]" />
                        <span>Synthesize 4K Sequence</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4K Render Library Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-[510] text-white">Rendered 4K Video Library</h3>
                <p className="text-xs text-[#8a8f98]">Stored in Supabase bucket storage and synced with Supabase Database.</p>
              </div>
              <span className="text-[11px] font-mono text-[#8a8f98]">{renders.length} Videos Available</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {renders.map((rnd) => (
                <div 
                  key={rnd.id}
                  className="hairline-card p-4 space-y-3 bg-[#0f1011] group hover:border-[#383b3f] transition-all flex flex-col justify-between"
                >
                  {/* Video Player Preview Container */}
                  <div className="w-full aspect-video rounded-lg bg-[#161718] border border-[#23252a] overflow-hidden relative group-hover:border-[#e4f222]/50 transition-colors">
                    <video
                      src={rnd.videoUrl}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#08090a]/80 backdrop-blur-sm border border-[#23252a] text-[10px] font-mono text-[#e4f222]">
                      4K UHD
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-[#08090a]/80 backdrop-blur-sm border border-[#23252a] text-[10px] font-mono text-white">
                      {rnd.duration}
                    </div>
                  </div>

                  {/* Video Metadata */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white truncate" title={rnd.title}>
                      {rnd.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8a8f98]">
                      <span>{rnd.format}</span>
                      <span>{rnd.time}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-[#23252a] flex items-center justify-between gap-2">
                    <a
                      href={rnd.videoUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded bg-[#161718] hover:bg-[#23252a] text-[#8a8f98] hover:text-white text-xs flex items-center gap-1 transition-colors"
                      title="Download MP4"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    {rnd.published ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#27a644] px-2.5 py-1 rounded bg-[#27a644]/10 border border-[#27a644]/30">
                        <Check className="w-3 h-3" />
                        <span>Live on 4 Platforms</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickPublish(rnd.id)}
                        className="flex-1 py-1.5 px-3 rounded bg-[#e4f222] hover:bg-[#ecf83e] text-[#08090a] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>1-Click Auto-Post</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SCHEDULE (Campaign Content Scheduler & Publishing Queue) */}
      {/* ========================================================================= */}
      {activeTab === "schedule" && (
        <div className="space-y-8 animate-in fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-[510] text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-6 h-6 text-[#eb5757]" />
                <span>Multi-Platform Content Scheduler</span>
              </h2>
              <p className="text-xs text-[#8a8f98] mt-1">
                Queue, schedule, and auto-dispatch 4K video drops across TikTok, Instagram Reels, YouTube Shorts, and X at optimal peak hours.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNewPostModal(true)}
              className="btn-acid-lime text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Post</span>
            </button>
          </div>

          {/* Schedule Calendar & Queue Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Auto-Publish Timeline Queue (7 cols) */}
            <div className="lg:col-span-7 hairline-card p-6 space-y-4 bg-[#0f1011]">
              <div className="flex items-center justify-between border-b border-[#23252a] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#02b8cc]" />
                  <h3 className="text-sm font-[510] text-white">Upcoming Publishing Queue</h3>
                </div>
                <span className="mono-badge text-[10px] text-[#27a644]">Auto-Cron Active</span>
              </div>

              <div className="space-y-3">
                {scheduledPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className="p-4 rounded-lg bg-[#08090a] border border-[#23252a] hover:border-[#383b3f] transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-semibold text-white">{post.title}</h4>
                        <div className="text-[11px] font-mono text-[#02b8cc] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{post.scheduledTime}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-[#e4f222] bg-[#e4f222]/10 px-2 py-0.5 rounded border border-[#e4f222]/30">
                        {post.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#23252a]/60 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 text-[#8a8f98]">
                        <span>Channels:</span>
                        <span className="text-white">{post.platforms.join(" • ")}</span>
                      </div>
                      <span className="text-[#62666d]">{post.aspect}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Peak Engagement Recommender & Strategy (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="hairline-card p-6 space-y-4 bg-[#0f1011]">
                <div className="flex items-center gap-2 border-b border-[#23252a] pb-3">
                  <TrendingUp className="w-4 h-4 text-[#27a644]" />
                  <h3 className="text-sm font-[510] text-white">AI Peak Timing Engine</h3>
                </div>

                <p className="text-xs text-[#8a8f98] leading-relaxed">
                  Based on historical audience velocity across your connected channels, the optimal dispatch window today is:
                </p>

                <div className="p-3 rounded-lg bg-[#161718] border border-[#23252a] space-y-1">
                  <div className="text-[11px] text-[#8a8f98] font-mono">RECOMMENDED SLOT</div>
                  <div className="text-sm font-mono font-medium text-[#e4f222]">18:00 – 21:30 UTC</div>
                  <div className="text-[10px] text-[#27a644]">+42% estimated initial 30-min view velocity</div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#23252a]/50">
                    <span className="text-[#8a8f98]">TikTok algorithm score:</span>
                    <span className="text-white font-mono">98/100 (Optimal)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#23252a]/50">
                    <span className="text-[#8a8f98]">Instagram Reels viral rank:</span>
                    <span className="text-white font-mono">94/100 (High)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#8a8f98]">YouTube Shorts speed index:</span>
                    <span className="text-white font-mono">96/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONNECT SOCIAL (Social Accounts & API Integration Hub) */}
      {/* ========================================================================= */}
      {activeTab === "connect-social" && (
        <div className="space-y-8 animate-in fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-[510] text-white tracking-tight flex items-center gap-2">
                <Share2 className="w-6 h-6 text-[#02b8cc]" />
                <span>Connected Social Accounts Hub</span>
              </h2>
              <p className="text-xs text-[#8a8f98] mt-1">
                Link and manage official API integrations for automatic 4K video uploads, hashtags, and description syncing.
              </p>
            </div>

            <span className="mono-badge text-[10px] text-[#27a644]">
              OAuth 2.0 Direct Auth
            </span>
          </div>

          {/* Social Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {channels.map((ch) => {
              const isConnected = ch.status === "Connected";
              return (
                <div 
                  key={ch.id}
                  className="hairline-card p-5 space-y-4 bg-[#0f1011] flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#161718] border border-[#23252a] flex items-center justify-center text-base font-mono">
                          {ch.icon}
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-white">{ch.name}</h4>
                          <div className="text-[10px] text-[#8a8f98] font-mono">{ch.handle}</div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isConnected
                          ? "bg-[#27a644]/10 text-[#27a644] border-[#27a644]/30"
                          : "bg-[#161718] text-[#8a8f98] border-[#23252a]"
                      }`}>
                        {ch.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#23252a]/60 text-xs">
                      <div>
                        <span className="text-[10px] text-[#8a8f98] block">Audience</span>
                        <span className="font-mono text-white font-medium">{ch.followers}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8a8f98] block">Engagement</span>
                        <span className="font-mono text-[#27a644]">{ch.engagement}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleChannel(ch.id)}
                    className={`w-full py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                      isConnected
                        ? "bg-[#161718] hover:bg-[#23252a] text-[#8a8f98] hover:text-white border border-[#23252a]"
                        : "bg-[#e4f222] hover:bg-[#ecf83e] text-[#08090a]"
                    }`}
                  >
                    {isConnected ? "Disconnect Channel" : "Connect Account (OAuth)"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ACCOUNT (Billing, Plans, GPU Quota) */}
      {/* ========================================================================= */}
      {activeTab === "account" && (
        <div className="space-y-8 animate-in fade-in">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-[510] text-white tracking-tight flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-[#8b5cf6]" />
              <span>Account &amp; GPU Compute Allocation</span>
            </h2>
            <p className="text-xs text-[#8a8f98] mt-1">
              Manage your subscription tier, compute minute limits, and invoice history.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Current Plan & Quota Card (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="hairline-card p-6 space-y-5 bg-[#0f1011]">
                <div className="flex items-center justify-between border-b border-[#23252a] pb-4">
                  <div>
                    <span className="text-[11px] font-mono text-[#e4f222]">CURRENT ACTIVE PLAN</span>
                    <h3 className="text-xl font-[510] text-white mt-0.5">{userPlan} Tier</h3>
                  </div>
                  <span className="mono-badge text-xs text-[#27a644]">Active &amp; Synced</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8a8f98]">GPU Compute Minutes Quota</span>
                    <span className="text-white font-mono">184 used / 600 min</span>
                  </div>
                  <div className="w-full h-2 bg-[#161718] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#27a644] to-[#e4f222] w-[30.6%] rounded-full"></div>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-[#8a8f98]">
                    <span>Resets on 1st of next month</span>
                    <span className="text-[#27a644]">416 min remaining</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#23252a] flex items-center gap-3">
                  <button 
                    type="button"
                    className="btn-acid-lime text-xs py-2 px-4 cursor-pointer"
                  >
                    Upgrade to Enterprise
                  </button>
                  <button 
                    type="button"
                    className="btn-ghost text-xs py-2 px-4 cursor-pointer"
                  >
                    Add 200 Compute Mins ($29)
                  </button>
                </div>
              </div>

              {/* Invoices List */}
              <div className="hairline-card p-6 space-y-4 bg-[#0f1011]">
                <h4 className="text-xs font-semibold text-white">Recent Invoices</h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded bg-[#08090a] border border-[#23252a] flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">Studio Pro Monthly Subscription</div>
                      <div className="text-[10px] text-[#8a8f98] font-mono">Aug 01, 2026 • Stripe #inv_98124</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-white">$79.00</span>
                      <span className="text-[10px] text-[#27a644] font-mono bg-[#27a644]/10 px-2 py-0.5 rounded border border-[#27a644]/30">Paid</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Plan Comparison (5 cols) */}
            <div className="lg:col-span-5 hairline-card p-6 space-y-4 bg-[#0f1011]">
              <h4 className="text-xs font-semibold text-white border-b border-[#23252a] pb-3">
                Plan Inclusions
              </h4>
              <ul className="space-y-2.5 text-xs text-[#d0d6e0]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e4f222]" />
                  <span>Direct 4K UHD 60fps &amp; 120fps Rendering</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e4f222]" />
                  <span>600 GPU Minutes per billing cycle</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e4f222]" />
                  <span>Unlimited Social Account Integrations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e4f222]" />
                  <span>AI Temporal Coherence Engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e4f222]" />
                  <span>Priority H100 Node Queue</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SETTINGS (Presets, API Keys, Webhooks) */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="space-y-8 animate-in fade-in">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-[510] text-white tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-[#d0d6e0]" />
              <span>Studio Configuration &amp; API Settings</span>
            </h2>
            <p className="text-xs text-[#8a8f98] mt-1">
              Configure default render parameters, API access keys, webhooks, and alert notifications.
            </p>
          </div>

          <div className="space-y-6">
            {/* API Key Box */}
            <div className="hairline-card p-6 space-y-4 bg-[#0f1011]">
              <div className="flex items-center justify-between border-b border-[#23252a] pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#e4f222]" />
                  <h3 className="text-sm font-[510] text-white">Live REST &amp; Python SDK API Key</h3>
                </div>
                <span className="mono-badge text-[10px] text-[#27a644]">Read / Write</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  readOnly
                  value={apiKey}
                  className="flex-1 bg-[#161718] border border-[#23252a] rounded p-2 text-xs font-mono text-[#ffffff] outline-none"
                />
                <button
                  type="button"
                  onClick={copyApiKey}
                  className="btn-ghost py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-[#27a644]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? "Copied" : "Copy Key"}</span>
                </button>
              </div>
            </div>

            {/* Default Render Quality Settings */}
            <div className="hairline-card p-6 space-y-4 bg-[#0f1011]">
              <div className="flex items-center gap-2 border-b border-[#23252a] pb-3">
                <Sliders className="w-4 h-4 text-[#02b8cc]" />
                <h3 className="text-sm font-[510] text-white">Default Synthesis Presets</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] text-[#8a8f98] block mb-1.5">Default Quality</label>
                  <select className="w-full bg-[#161718] border border-[#23252a] text-xs text-white rounded p-2 outline-none">
                    <option>4K Ultra HD (3840x2160)</option>
                    <option>1080p Full HD (1920x1080)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#8a8f98] block mb-1.5">Auto-Reframe To Vertical</label>
                  <select className="w-full bg-[#161718] border border-[#23252a] text-xs text-white rounded p-2 outline-none">
                    <option>Enabled (Smart Subject Centering)</option>
                    <option>Disabled</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#8a8f98] block mb-1.5">Watermark</label>
                  <select className="w-full bg-[#161718] border border-[#23252a] text-xs text-white rounded p-2 outline-none">
                    <option>None (Clean Master)</option>
                    <option>Studio Watermark</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PROFILE (Clerk UserProfile & Identity) */}
      {/* ========================================================================= */}
      {activeTab === "profile" && (
        <div className="space-y-8 animate-in fade-in">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-[510] text-white tracking-tight flex items-center gap-2">
              <User className="w-6 h-6 text-[#e4f222]" />
              <span>User Profile &amp; Security</span>
            </h2>
            <p className="text-xs text-[#8a8f98] mt-1">
              Manage your personal identity, email addresses, passkeys, and connected authentication methods.
            </p>
          </div>

          {/* Clerk User Profile Container */}
          <div className="hairline-card p-6 bg-[#0f1011] flex justify-center shadow-2xl">
            <UserProfile routing="hash" />
          </div>
        </div>
      )}
    </div>
  );
}
