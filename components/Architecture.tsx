"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  SlidersHorizontal, Video, Layers, Wand2, 
  Volume2, Download, Eye, Sparkles, CheckCircle2 
} from "lucide-react";

export function Architecture() {
  // Split comparison slider position (percentage 0 - 100)
  const [sliderPos, setSliderPos] = useState(50);
  const isDragging = useRef(false);

  const handlePointerDown = () => {
    isDragging.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <section className="py-24 border-t border-[#161718] bg-[#08090a]" id="features">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-[700px] mb-16">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#161718] border border-[#23252a] text-[11px] font-mono text-[#02b8cc] mb-4">
            <span>ARCHITECTURE</span>
          </div>
          <h2 className="section-title text-[#ffffff] mb-4">
            Built like a high-precision camera rig.
          </h2>
          <p className="text-base text-[#8a8f98] leading-relaxed">
            Eliminate morphing artifacts and wandering subjects. Kinetic couples spatial diffusion latents with deterministic 3D motion splines.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Feature 1: Temporal Consistency Interactive Comparison Slider (8 Cols) */}
          <div className="md:col-span-12 lg:col-span-8 hairline-card p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="mono-badge text-[#e4f222]">CORE-ENG-01</span>
                <span className="text-[11px] font-mono text-[#8a8f98]">Sub-Frame Attention</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-[510] text-[#ffffff]">
                Temporal Vector Lock &amp; Zero Flickering
              </h3>
              <p className="text-sm text-[#8a8f98] leading-relaxed max-w-2xl">
                Proprietary cross-frame attention tracking preserves facial geometry, materials, and atmospheric lighting across 1,000+ frames without drift.
              </p>
            </div>

            {/* Interactive Split Comparison Box */}
            <div 
              className="relative w-full h-[260px] sm:h-[320px] rounded-lg overflow-hidden border border-[#23252a] select-none touch-none cursor-ew-resize bg-[#0f1011]"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Left Side: Standard Video Diffusion (Jittery/Morphing) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#1a1215] via-[#120a10] to-[#0a0c10] flex items-center justify-center p-6">
                <div className="text-center space-y-2 opacity-60">
                  <div className="w-12 h-12 mx-auto rounded-full border border-[#eb5757]/40 flex items-center justify-center text-[#eb5757]">
                    ✕
                  </div>
                  <div className="text-xs font-mono text-[#eb5757]">Standard Generative Video</div>
                  <p className="text-[11px] text-[#8a8f98] max-w-xs">
                    Drifting facial landmarks, fluctuating clothing patterns, and flickering light
                  </p>
                </div>
                {/* Floating Tag */}
                <div className="absolute top-3 left-3 px-2 py-1 rounded bg-[#08090a]/80 backdrop-blur-md border border-[#eb5757]/30 text-[10px] font-mono text-[#eb5757]">
                  UNCONSTRAINED DRIFT
                </div>
              </div>

              {/* Right Side: Kinetic Optical Lock (Coherent/Razor Sharp) */}
              <div 
                className="absolute inset-y-0 right-0 bg-gradient-to-tr from-[#0b1411] via-[#091512] to-[#08090a] flex items-center justify-center p-6 border-l border-[#e4f222]"
                style={{ width: `${100 - sliderPos}%` }}
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full border border-[#27a644]/40 flex items-center justify-center text-[#27a644]">
                    ✓
                  </div>
                  <div className="text-xs font-mono text-[#27a644]">Kinetic Optical Vector Lock</div>
                  <p className="text-[11px] text-[#d0d6e0] max-w-xs">
                    Sub-pixel geometry preservation &amp; seamless 60fps frame interpolation
                  </p>
                </div>
                {/* Floating Tag */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded bg-[#08090a]/80 backdrop-blur-md border border-[#27a644]/30 text-[10px] font-mono text-[#27a644]">
                  KINETIC COHERENCE
                </div>
              </div>

              {/* Draggable Divider Handle */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-[#e4f222] shadow-[0_0_12px_#e4f222]"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#08090a] border border-[#e4f222] flex items-center justify-center text-[10px] text-[#e4f222] font-mono shadow-lg">
                  ↔
                </div>
              </div>
            </div>

            <div className="mt-3 text-center text-[11px] text-[#62666d] font-mono">
              Drag slider to compare sub-frame temporal lock vs standard diffusion drift
            </div>
          </div>

          {/* Feature 2: Explicit 6-DoF Camera Matrix (4 Cols) */}
          <div className="md:col-span-6 lg:col-span-4 hairline-card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="mono-badge text-[#02b8cc]">CAM-6DOF</span>
                <Video className="w-4 h-4 text-[#02b8cc]" />
              </div>
              <h3 className="text-lg font-[510] text-[#ffffff]">
                True 6-DoF Camera Splines
              </h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Control focal lengths, sensor format, pan/tilt velocity, and vertigo dolly zooms with physical millimeter precision.
              </p>
            </div>

            {/* Trajectory visualizer mini-hud */}
            <div className="p-3 rounded-lg bg-[#08090a] border border-[#23252a] space-y-2.5 font-mono text-[11px]">
              <div className="flex justify-between items-center text-[#8a8f98]">
                <span>X-DOLLY TRACK</span>
                <span className="text-[#ffffff]">+18.4m</span>
              </div>
              <div className="h-1 bg-[#161718] rounded-full overflow-hidden">
                <div className="h-full bg-[#02b8cc] w-[75%]"></div>
              </div>

              <div className="flex justify-between items-center text-[#8a8f98]">
                <span>FOCAL LENGTH</span>
                <span className="text-[#e4f222]">35mm T1.5</span>
              </div>
              <div className="h-1 bg-[#161718] rounded-full overflow-hidden">
                <div className="h-full bg-[#e4f222] w-[45%]"></div>
              </div>
            </div>
          </div>

          {/* Feature 3: Spatiotemporal Inpainting (4 Cols) */}
          <div className="md:col-span-6 lg:col-span-4 hairline-card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="mono-badge text-[#8b5cf6]">INPAINT-V2</span>
                <Wand2 className="w-4 h-4 text-[#8b5cf6]" />
              </div>
              <h3 className="text-lg font-[510] text-[#ffffff]">
                Spatiotemporal Inpainting
              </h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Brush over moving objects to swap wardrobes, alter lighting conditions, or outpaint canvas aspect ratios on existing footage.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="px-2 py-1 rounded bg-[#161718] border border-[#23252a] text-[10px] text-[#d0d6e0] font-mono">
                Object Replace
              </span>
              <span className="px-2 py-1 rounded bg-[#161718] border border-[#23252a] text-[10px] text-[#d0d6e0] font-mono">
                Aspect Outpaint
              </span>
              <span className="px-2 py-1 rounded bg-[#161718] border border-[#23252a] text-[10px] text-[#d0d6e0] font-mono">
                Lighting Relight
              </span>
            </div>
          </div>

          {/* Feature 4: Audio-Reactive Foley & Lip-Sync (4 Cols) */}
          <div className="md:col-span-6 lg:col-span-4 hairline-card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="mono-badge text-[#eb5757]">AUDIO-SYNC</span>
                <Volume2 className="w-4 h-4 text-[#eb5757]" />
              </div>
              <h3 className="text-lg font-[510] text-[#ffffff]">
                Synchronous Foley &amp; Lip Sync
              </h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                AI synthesizes matching spatial sound effects, cinematic footsteps, and multi-lingual sub-millisecond lip synchronization.
              </p>
            </div>

            <div className="flex items-center justify-center gap-1 h-12 bg-[#08090a] rounded border border-[#23252a] px-3">
              {[40, 75, 30, 90, 60, 85, 45, 95, 55, 70, 35, 80].map((h, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-[#eb5757] rounded-full transition-all duration-300"
                  style={{ height: `${h}%`, opacity: 0.4 + (h / 100) * 0.6 }}
                ></div>
              ))}
            </div>
          </div>

          {/* Feature 5: Native 4K ProRes & EXR Export (4 Cols) */}
          <div className="md:col-span-6 lg:col-span-4 hairline-card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="mono-badge text-[#27a644]">PIPELINE</span>
                <Download className="w-4 h-4 text-[#27a644]" />
              </div>
              <h3 className="text-lg font-[510] text-[#ffffff]">
                VFX Studio Pipeline Ready
              </h3>
              <p className="text-xs text-[#8a8f98] leading-relaxed">
                Export ProRes 4444 XQ, 32-bit OpenEXR depth maps, and FBX camera coordinates directly to Unreal Engine 5, Blender, or Nuke.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="px-2 py-1 rounded bg-[#161718] border border-[#23252a] text-[10px] text-[#27a644] font-mono">
                ProRes 4444 XQ
              </span>
              <span className="px-2 py-1 rounded bg-[#161718] border border-[#23252a] text-[10px] text-[#27a644] font-mono">
                OpenEXR Depth
              </span>
              <span className="px-2 py-1 rounded bg-[#161718] border border-[#23252a] text-[10px] text-[#27a644] font-mono">
                Unreal Engine Bridge
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
