"use client";

import React from "react";

export function SocialProof() {
  const logos = [
    { name: "VERCEL CREATIVE", icon: "▲" },
    { name: "NEURA VFX", icon: "❖" },
    { name: "SYNTH MEDIA", icon: "◈" },
    { name: "HYPERION MOTION", icon: "⬡" },
    { name: "LUMEN LABS", icon: "✦" },
    { name: "CHRONOS 3D", icon: "■" }
  ];

  return (
    <section className="py-12 border-t border-[#161718] bg-[#08090a] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <p className="text-[11px] font-mono tracking-wider text-[#62666d] uppercase mb-8">
          TRUSTED BY PRODUCTION TEAMS, VFX ARTISTS, AND MOTION DESIGNERS GLOBALLY
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {logos.map((logo) => (
            <div 
              key={logo.name}
              className="flex items-center gap-2.5 text-[#8a8f98] hover:text-[#d0d6e0] transition-colors cursor-default"
            >
              <span className="text-sm font-mono text-[#8a8f98]">{logo.icon}</span>
              <span className="text-xs font-medium tracking-tight">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
