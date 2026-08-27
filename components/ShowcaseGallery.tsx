"use client";

import React, { useState } from "react";
import { Play, Pause, Sparkles, ArrowUpRight, Film, Volume2, VolumeX } from "lucide-react";

interface ShowcaseGalleryProps {
  onSelectPrompt: (prompt: string, sceneKey: string) => void;
}

export function ShowcaseGallery({ onSelectPrompt }: ShowcaseGalleryProps) {
  const [filter, setFilter] = useState<"all" | "scifi" | "nature" | "commercial" | "cinematic">("all");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const items = [
    {
      id: "nebula-tether",
      category: "scifi",
      sceneKey: "space",
      tag: "Sci-Fi & VFX",
      tagColor: "text-[#02b8cc]",
      badge: "4K · 60fps",
      duration: "00:12",
      title: "Orbital Sci-Fi Encounter",
      prompt: "Deep space orbital station ascending into glowing cyan nebula, realistic titanium reflections, 60fps smooth orbit camera.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "abyssal-bio",
      category: "nature",
      sceneKey: "liquid",
      tag: "Nature & Macro",
      tagColor: "text-[#27a644]",
      badge: "4K · 120fps",
      duration: "00:10",
      title: "Chromatic Flame & Liquid Dynamics",
      prompt: "Macro high-speed capture of incandescent flame and fluid plasma explosion, suspended embers, chromatic dispersion.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      poster: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "chrome-shoe",
      category: "commercial",
      sceneKey: "liquid",
      tag: "Commercial",
      tagColor: "text-[#8b5cf6]",
      badge: "9:16 Vertical",
      duration: "00:08",
      title: "Action Sports Commercial",
      prompt: "High-energy commercial shot, cinematic drone chase tracking extreme athletes through mountain canyons in golden hour light.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "coastal-pass",
      category: "cinematic",
      sceneKey: "cyberpunk",
      tag: "Cinematic Narrative",
      tagColor: "text-[#eb5757]",
      badge: "2.39:1 Scope",
      duration: "00:15",
      title: "Epic Cinematic Narrative",
      prompt: "Anamorphic 35mm wide tracking shot of heroic characters navigating a vibrant animated fantasy landscape at twilight.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
      poster: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80"
    }
  ];

  const filteredItems = filter === "all" ? items : items.filter((item) => item.category === filter);

  return (
    <section className="py-24 border-t border-[#161718] bg-[#08090a]" id="showcase">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-[600px]">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#161718] border border-[#23252a] text-[11px] font-mono text-[#e4f222] mb-4">
              <span>CDN VIDEO EXAMPLES</span>
            </div>
            <h2 className="section-title text-[#ffffff] mb-3">
              Shorts cut from real videos.
            </h2>
            <p className="text-sm text-[#8a8f98]">
              Example shorts our users made from long-form videos. Every clip is auto-reframed, captioned, and ready to publish.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Genres" },
              { id: "scifi", label: "Sci-Fi" },
              { id: "nature", label: "Nature" },
              { id: "commercial", label: "Commercial" },
              { id: "cinematic", label: "Cinematic" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  filter === f.id
                    ? "bg-[#ffffff] text-[#08090a] font-medium"
                    : "bg-[#161718] text-[#8a8f98] hover:text-[#ffffff] border border-[#23252a] hover:border-[#383b3f]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const isHovered = hoveredCard === item.id;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredCard(item.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="hairline-card overflow-hidden group flex flex-col justify-between"
              >
                {/* Media Preview Box with External CDN Video Tag */}
                <div className="relative aspect-video bg-[#161718] overflow-hidden flex items-center justify-center border-b border-[#23252a]">
                  <video
                    src={item.videoUrl}
                    poster={item.poster}
                    muted
                    loop
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Duration Tag */}
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-[#08090a]/80 backdrop-blur-md border border-[#23252a] text-[10px] font-mono text-[#d0d6e0] z-10">
                    {item.duration}
                  </span>

                  {/* Live CDN Badge */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#08090a]/80 backdrop-blur-md border border-[#23252a] text-[9px] font-mono text-[#27a644] flex items-center gap-1 z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#27a644] animate-pulse"></span>
                    CDN STREAM
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-mono font-medium ${item.tagColor}`}>
                        {item.tag}
                      </span>
                      <span className="mono-badge text-[10px]">{item.badge}</span>
                    </div>
                    <h4 className="text-sm font-medium text-[#ffffff] group-hover:text-[#e4f222] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#8a8f98] line-clamp-2 leading-relaxed">
                      "{item.prompt}"
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectPrompt(item.prompt, item.sceneKey)}
                    className="w-full py-2 px-3 rounded bg-[#161718] hover:bg-[#23252a] border border-[#23252a] hover:border-[#383b3f] text-xs text-[#d0d6e0] hover:text-[#ffffff] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Load into Studio</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#e4f222]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
