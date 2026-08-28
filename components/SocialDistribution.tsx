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
      color: "#00f2ea",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      ),
      followers: "142.5K"
    },
    {
      id: "reels",
      name: "Instagram Reels",
      handle: "@kinetic.motion",
      ratio: "9:16 Vertical",
      color: "#e4405f",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      followers: "89.2K"
    },
    {
      id: "shorts",
      name: "YouTube Shorts",
      handle: "Kinetic Cinema",
      ratio: "9:16 & 16:9",
      color: "#ff0000",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      followers: "230K"
    },
    {
      id: "x",
      name: "X (Twitter)",
      handle: "@Kinetic_AI",
      ratio: "16:9 & 1:1",
      color: "#ffffff",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      followers: "54.1K"
    },
    {
      id: "linkedin",
      name: "LinkedIn Video",
      handle: "Kinetic Technologies",
      ratio: "1:1 & 16:9",
      color: "#0077b5",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
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
                  { 
                    ratio: "9:16", 
                    label: "TikTok / Reels", 
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 mx-auto" fill="currentColor">
                        <rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 7h6M9 10h6M9 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )
                  },
                  { 
                    ratio: "16:9", 
                    label: "YouTube 4K", 
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 mx-auto" fill="currentColor">
                        <rect x="2" y="7" width="20" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                        <path d="M5 10h14M5 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )
                  },
                  { 
                    ratio: "1:1", 
                    label: "X / LinkedIn", 
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 mx-auto" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 9h6M9 12h6M9 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )
                  }
                ].map((fmt) => (
                  <button
                    key={fmt.ratio}
                    onClick={() => setActiveFormat(fmt.ratio as any)}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      activeFormat === fmt.ratio
                        ? "bg-[#161718] border-[#e4f222] text-[#e4f222]"
                        : "bg-[#0c0d0e] border-[#23252a] text-[#8a8f98] hover:border-[#383b3f]"
                    }`}
                  >
                    <div className="mb-1">{fmt.icon}</div>
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
