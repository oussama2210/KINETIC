"use client";

import React, { useState } from "react";
import { 
  Share2, Calendar, CheckCircle2, Sparkles, 
  TrendingUp, Clock, RefreshCw, Send, SlidersHorizontal, Check 
} from "lucide-react";

export function SocialDistribution() {
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "tiktok", "reels", "shorts", "x"
  ]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<Record<string, "idle" | "publishing" | "done">>({
    tiktok: "idle",
    reels: "idle",
    shorts: "idle",
    x: "idle",
    linkedin: "idle"
  });
  const [autoCaption, setAutoCaption] = useState(
    "Synthesized this cyberpunk alley sequence in 4K with @KineticAI. 🌧️✨ 60fps temporal lock is insane! #AIVideo #Cyberpunk #VFX #Filmmaking"
  );
  const [activeFormat, setActiveFormat] = useState<"9:16" | "16:9" | "1:1">("9:16");

  const channels = [
    {
      id: "tiktok",
      name: "TikTok",
      handle: "@kinetic_studio",
      ratio: "9:16 Vertical",
      color: "#02b8cc",
      icon: "♪",
      followers: "142.5K"
    },
    {
      id: "reels",
      name: "Instagram Reels",
      handle: "@kinetic.motion",
      ratio: "9:16 Vertical",
      color: "#eb5757",
      icon: "📸",
      followers: "89.2K"
    },
    {
      id: "shorts",
      name: "YouTube Shorts",
      handle: "Kinetic Cinema",
      ratio: "9:16 & 16:9",
      color: "#eb5757",
      icon: "▶",
      followers: "230K"
    },
    {
      id: "x",
      name: "X (Twitter)",
      handle: "@Kinetic_AI",
      ratio: "16:9 & 1:1",
      color: "#ffffff",
      icon: "𝕏",
      followers: "54.1K"
    },
    {
      id: "linkedin",
      name: "LinkedIn Video",
      handle: "Kinetic Technologies",
      ratio: "1:1 & 16:9",
      color: "#6366f1",
      icon: "in",
      followers: "31.8K"
    }
  ];

  const toggleChannel = (id: string) => {
    if (selectedChannels.includes(id)) {
      setSelectedChannels(selectedChannels.filter(c => c !== id));
    } else {
      setSelectedChannels([...selectedChannels, id]);
    }
  };

  const handlePublishAll = () => {
    if (isPublishing || selectedChannels.length === 0) return;
    setIsPublishing(true);

    const initial: Record<string, "idle" | "publishing" | "done"> = {};
    selectedChannels.forEach(c => initial[c] = "publishing");
    setPublishStatus(initial);

    selectedChannels.forEach((channelId, index) => {
      setTimeout(() => {
        setPublishStatus(prev => ({ ...prev, [channelId]: "done" }));
        if (index === selectedChannels.length - 1) {
          setIsPublishing(false);
        }
      }, 1000 + index * 600);
    });
  };

  return (
    <section className="py-24 border-t border-[#161718] bg-[#08090a]" id="distribution">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-[700px] mb-16">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#161718] border border-[#23252a] text-[11px] font-mono text-[#e4f222] mb-4">
            <Share2 className="w-3.5 h-3.5" />
            <span>UNIFIED SOCIAL HUB</span>
          </div>
          <h2 className="section-title text-[#ffffff] mb-4">
            Generate once. Auto-distribute everywhere.
          </h2>
          <p className="text-base text-[#8a8f98] leading-relaxed">
            Eliminate tedious manual exporting and re-uploading. Connect your TikTok, Instagram Reels, YouTube Shorts, X, and LinkedIn accounts to reframe, caption, and schedule in one click.
          </p>
        </div>

        {/* Interactive Distribution Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Connected Accounts & One-Click Publisher Card (7 Cols) */}
          <div className="lg:col-span-7 hairline-card p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-[510] text-[#ffffff]">Connected Channels</span>
                  <span className="mono-badge text-[#27a644]">5 Active</span>
                </div>
                <span className="text-xs text-[#8a8f98] font-mono">
                  {selectedChannels.length} selected for instant sync
                </span>
              </div>

              {/* Channel Selector List */}
              <div className="space-y-2.5">
                {channels.map((ch) => {
                  const isSelected = selectedChannels.includes(ch.id);
                  const status = publishStatus[ch.id];

                  return (
                    <div
                      key={ch.id}
                      onClick={() => toggleChannel(ch.id)}
                      className={`p-3.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? "bg-[#121315] border-[#23252a] hover:border-[#383b3f]" 
                          : "bg-[#0c0d0e]/50 border-[#1f2126] opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className={`w-5 h-5 rounded flex items-center justify-center text-xs border transition-colors ${
                            isSelected 
                              ? "bg-[#e4f222] text-[#08090a] border-[#e4f222]" 
                              : "border-[#383b3f] text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div className="w-8 h-8 rounded-md bg-[#161718] border border-[#23252a] flex items-center justify-center text-sm font-mono">
                          {ch.icon}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-[#ffffff] flex items-center gap-2">
                            {ch.name}
                            <span className="text-[10px] text-[#8a8f98] font-mono">{ch.handle}</span>
                          </div>
                          <div className="text-[11px] text-[#62666d]">
                            Auto-Reframes: {ch.ratio} • {ch.followers} audience
                          </div>
                        </div>
                      </div>

                      {/* Live Sync Status */}
                      <div>
                        {status === "publishing" && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#02b8cc]">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Dispatching...
                          </span>
                        )}
                        {status === "done" && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#27a644]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Published Live
                          </span>
                        )}
                        {status === "idle" && (
                          <span className="mono-badge text-[10px]">Ready to sync</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Viral Copywriting Box */}
            <div className="p-4 rounded-lg bg-[#08090a] border border-[#23252a] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#ffffff] font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#e4f222]" />
                  AI Viral Captions &amp; SEO Tags
                </span>
                <span className="text-[10px] font-mono text-[#8a8f98]">Auto-tailored for 5 platforms</span>
              </div>
              <textarea
                rows={2}
                value={autoCaption}
                onChange={(e) => setAutoCaption(e.target.value)}
                className="w-full bg-[#0f1011] border border-[#23252a] rounded p-2.5 text-xs text-[#d0d6e0] outline-none resize-none font-sans focus:border-[#e4f222] transition-colors"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handlePublishAll}
                disabled={isPublishing || selectedChannels.length === 0}
                className="btn-acid-lime w-full sm:flex-1 py-3 text-xs cursor-pointer"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#08090a]" />
                    <span>Broadcasting to {selectedChannels.length} Channels...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#08090a]" />
                    <span>Publish to All Selected Channels ({selectedChannels.length})</span>
                  </>
                )}
              </button>

              <button className="btn-ghost w-full sm:w-auto py-3 px-4 text-xs flex items-center justify-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#8a8f98]" />
                <span>Schedule Campaign</span>
              </button>
            </div>
          </div>

          {/* Right: Smart Re-framing & Viral Analytics Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Smart Auto-Reframe Feature Card */}
            <div className="hairline-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="mono-badge text-[#02b8cc]">SMART CROP</span>
                <SlidersHorizontal className="w-4 h-4 text-[#02b8cc]" />
              </div>
              <h3 className="text-base font-[510] text-[#ffffff]">
                AI Subject-Tracking Re-framing
              </h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Automatically isolates the main subject and reframes landscape (16:9) renders into vertical (9:16) and square (1:1) clips without losing the focal point.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2">
                {[
                  { ratio: "9:16", label: "TikTok / Reels", icon: "📱" },
                  { ratio: "16:9", label: "YouTube 4K", icon: "🖥️" },
                  { ratio: "1:1", label: "X / LinkedIn", icon: "🔲" }
                ].map((fmt) => (
                  <button
                    key={fmt.ratio}
                    onClick={() => setActiveFormat(fmt.ratio as any)}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      activeFormat === fmt.ratio
                        ? "bg-[#161718] border-[#e4f222] text-[#ffffff]"
                        : "bg-[#0c0d0e] border-[#23252a] text-[#8a8f98] hover:border-[#383b3f]"
                    }`}
                  >
                    <div className="text-sm mb-1">{fmt.icon}</div>
                    <div className="text-xs font-mono font-medium text-[#ffffff]">{fmt.ratio}</div>
                    <div className="text-[9px] text-[#62666d]">{fmt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Unified Analytics Card */}
            <div className="hairline-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="mono-badge text-[#27a644]">ANALYTICS HUB</span>
                <TrendingUp className="w-4 h-4 text-[#27a644]" />
              </div>
              <h3 className="text-base font-[510] text-[#ffffff]">
                Cross-Platform Real-time Reach
              </h3>

              <div className="grid grid-cols-2 gap-3 pt-1 font-mono">
                <div className="p-3 rounded bg-[#08090a] border border-[#23252a]">
                  <div className="text-[10px] text-[#8a8f98]">TOTAL REACH</div>
                  <div className="text-lg text-[#ffffff] font-medium">1.42M+</div>
                  <div className="text-[9px] text-[#27a644]">▲ +34.2% this week</div>
                </div>
                <div className="p-3 rounded bg-[#08090a] border border-[#23252a]">
                  <div className="text-[10px] text-[#8a8f98]">AVG WATCH TIME</div>
                  <div className="text-lg text-[#e4f222] font-medium">84.8%</div>
                  <div className="text-[9px] text-[#27a644]">▲ 4.2x above average</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
