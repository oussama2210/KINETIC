"use client";

import React, { useState } from "react";
import { Search, Sparkles, Video, Terminal, ArrowRight, X } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: string, payload?: any) => void;
}

export function CommandPalette({ isOpen, onClose, onSelectAction }: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const actions = [
    {
      id: "gen-cyberpunk",
      category: "Presets",
      title: "Load Preset: Cyberpunk Tokyo Rain (35mm Anamorphic)",
      icon: <Sparkles className="w-4 h-4 text-[#e4f222]" />,
      action: () => {
        onSelectAction("load-preset", "cyberpunk");
        onClose();
      }
    },
    {
      id: "gen-liquid",
      category: "Presets",
      title: "Load Preset: Molten Gold 120fps Super Slow-Mo",
      icon: <Sparkles className="w-4 h-4 text-[#02b8cc]" />,
      action: () => {
        onSelectAction("load-preset", "liquid");
        onClose();
      }
    },
    {
      id: "gen-space",
      category: "Presets",
      title: "Load Preset: Exoplanet Ruin & Bioluminescent Aurora",
      icon: <Sparkles className="w-4 h-4 text-[#8b5cf6]" />,
      action: () => {
        onSelectAction("load-preset", "space");
        onClose();
      }
    },
    {
      id: "cam-orbit",
      category: "Camera Trajectory",
      title: "Set Camera: 3D Orbit Arc (60 FPS)",
      icon: <Video className="w-4 h-4 text-[#27a644]" />,
      action: () => {
        onSelectAction("set-camera", "Orbit Arc (3D)");
        onClose();
      }
    },
    {
      id: "cam-dolly",
      category: "Camera Trajectory",
      title: "Set Camera: Dolly Zoom Vertigo",
      icon: <Video className="w-4 h-4 text-[#27a644]" />,
      action: () => {
        onSelectAction("set-camera", "Dolly Zoom (Vertigo)");
        onClose();
      }
    },
    {
      id: "api-docs",
      category: "Documentation",
      title: "Join Developer SDK & API Waitlist (Coming Soon)",
      icon: <Terminal className="w-4 h-4 text-[#e4f222]" />,
      action: () => {
        const el = document.getElementById("api");
        if (el) el.scrollIntoView({ behavior: "smooth" });
        onClose();
      }
    }
  ];

  const filtered = actions.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#0f1011] border border-[#23252a] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#23252a] gap-3">
          <Search className="w-4 h-4 text-[#8a8f98]" />
          <input
            type="text"
            placeholder="Type a command or scene prompt... (e.g. Cyberpunk, Camera, SDK)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-[#ffffff] placeholder-[#62666d] outline-none font-sans"
          />
          <button 
            onClick={onClose}
            className="p-1 text-[#8a8f98] hover:text-[#ffffff] rounded transition-colors"
          >
            <span className="mono-badge text-[10px]">ESC</span>
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#161718]">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-[#161718] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded bg-[#161718] border border-[#23252a] group-hover:border-[#383b3f]">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs text-[#ffffff] group-hover:text-[#e4f222] font-medium transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[#62666d]">
                      {item.category}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#62666d] group-hover:text-[#e4f222] opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
              </button>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-[#62666d]">
              No actions matching "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#08090a] border-t border-[#23252a] flex items-center justify-between text-[11px] text-[#62666d] font-mono">
          <span>Navigation: ↑ ↓ · Select: ↵</span>
          <span>KINETIC Studio v3.4</span>
        </div>
      </div>
    </div>
  );
}
