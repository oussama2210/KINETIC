"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, Sparkles, Sliders, Maximize2, 
  RotateCw, RefreshCw, Layers, Check, Camera, Film, Share2, Send, CheckCircle2, Volume2, VolumeX
} from "lucide-react";

interface StudioWorkspaceProps {
  externalPreset?: string;
  externalCamera?: string;
}

export function StudioWorkspace({ externalPreset, externalCamera }: StudioWorkspaceProps) {
  // Studio State
  const [activeScene, setActiveScene] = useState<"cyberpunk" | "liquid" | "space" | "portrait">("cyberpunk");
  const [prompt, setPrompt] = useState(
    "Hyper-lapse tracking shot through neon-drenched Neo-Tokyo alleyway in heavy rain, reflections on wet asphalt, volumetric steam, anamorphic 35mm lens, photorealistic 8k render."
  );
  const [cameraMotion, setCameraMotion] = useState("Orbit Arc (3D)");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1" | "2.39:1">("16:9");
  const [motionIntensity, setMotionIntensity] = useState(7.5);
  const [coherence, setCoherence] = useState(9.8);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(12.0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStepText, setRenderStepText] = useState("");
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [seed, setSeed] = useState(89410294);

  // Social Dispatch State
  const [isSocialPublishing, setIsSocialPublishing] = useState(false);
  const [socialDone, setSocialDone] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // High quality external CDN video samples
  const sceneData = {
    cyberpunk: {
      title: "Cyberpunk Tokyo",
      prompt: "Hyper-lapse tracking shot through neon-drenched Neo-Tokyo alleyway in heavy rain, reflections on wet asphalt, volumetric steam, anamorphic 35mm lens, photorealistic 8k render.",
      cam: "Orbit Arc (3D)",
      lens: "35mm Anamorphic f/1.4",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      fallbackPoster: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"
    },
    liquid: {
      title: "Molten Gold 120fps",
      prompt: "Macro high-speed capture of iridescent liquid droplet colliding with molten gold surface, suspended splash crown, chromatic dispersion, 120fps super slow motion.",
      cam: "Dolly Zoom (Vertigo)",
      lens: "100mm Macro f/2.8",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      fallbackPoster: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80"
    },
    space: {
      title: "Exoplanet Ruin",
      prompt: "Astronaut exploring ancient crystalline monolithic ruins on deep space planet, bioluminescent aurora borealis in midnight sky, cinematic wide drone orbit.",
      cam: "Orbit Arc (3D)",
      lens: "24mm Ultra-Wide f/2.0",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      fallbackPoster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"
    },
    portrait: {
      title: "Android Artisan",
      prompt: "Close-up portrait of cyberpunk android artisan crafting vintage watch movement in cozy dimly lit workshop, optical lens flare, shallow depth of field.",
      cam: "Crane Pan Left",
      lens: "85mm Portrait f/1.2",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
      fallbackPoster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80"
    }
  };

  // Sync external triggers
  useEffect(() => {
    if (externalPreset && ["cyberpunk", "liquid", "space", "portrait"].includes(externalPreset)) {
      handleSelectScene(externalPreset as any);
    }
  }, [externalPreset]);

  useEffect(() => {
    if (externalCamera) {
      setCameraMotion(externalCamera);
    }
  }, [externalCamera]);

  const handleSelectScene = (key: "cyberpunk" | "liquid" | "space" | "portrait") => {
    setActiveScene(key);
    setPrompt(sceneData[key].prompt);
    setCameraMotion(sceneData[key].cam);
    setIsEnhanced(false);
    setSocialDone(false);
    setSeed(Math.floor(10000000 + Math.random() * 90000000));
    
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleEnhancePrompt = () => {
    if (isEnhanced) return;
    setIsEnhanced(true);
    setPrompt((prev) => 
      prev + " --camera 6dof-matrix --optical-coherence 0.98 --color-grading arri-alexa-logc --shutter 180deg"
    );
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleGenerate = () => {
    if (isRendering) return;
    setIsRendering(true);
    setRenderProgress(0);
    setSocialDone(false);
    setRenderStepText("Allocating 4K latent tensor VRAM on H100 cluster...");

    const steps = [
      { p: 15, msg: "Diffusing spatial keyframes (Step 4/30)..." },
      { p: 38, msg: "Evaluating optical flow vector splines (Step 12/30)..." },
      { p: 65, msg: "Applying temporal lock & character consistency pass..." },
      { p: 88, msg: "AI Auto-Reframing: 16:9 Landscape + 9:16 Vertical for Reels/TikTok..." },
      { p: 100, msg: "Synthesized 4K sequence ready for 1-Click Multi-Publish." }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setRenderProgress(steps[currentStep].p);
        setRenderStepText(steps[currentStep].msg);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsRendering(false);
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
          setSeed(Math.floor(10000000 + Math.random() * 90000000));
        }, 500);
      }
    }, 550);
  };

  const handleQuickSocialPublish = () => {
    if (isSocialPublishing) return;
    setIsSocialPublishing(true);
    setTimeout(() => {
      setIsSocialPublishing(false);
      setSocialDone(true);
    }, 1200);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00.00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(frames).padStart(2, "0")}`;
  };

  return (
    <section className="relative px-4 pb-20 max-w-[1240px] mx-auto z-10" id="studio">
      <div className="hairline-card bg-[#0f1011] overflow-hidden shadow-2xl">
        {/* Frame Title Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#23252a] bg-[#0c0d0e]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#23252a] hover:bg-[#eb5757] transition-colors cursor-pointer"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#23252a] hover:bg-[#e4f222] transition-colors cursor-pointer"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#23252a] hover:bg-[#27a644] transition-colors cursor-pointer"></span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#8a8f98] font-mono">PRJ-9042</span>
              <span className="text-[#383b3f]">/</span>
              <span className="text-[#d0d6e0] font-medium hidden sm:inline">
                {activeScene}_cdn_render_4k.mp4
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#161718] border border-[#23252a] text-[11px] text-[#27a644] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#27a644] animate-pulse"></span>
              CDN Video Stream Active
            </span>
            <span className="mono-badge hidden sm:inline-flex text-[#e4f222]">Auto-Publish Connected</span>
          </div>
        </div>

        {/* Studio Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Video Viewport with External CDN (7 Cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col justify-between bg-[#08090a]/60 border-b lg:border-b-0 lg:border-r border-[#23252a]">
            {/* Viewport Container */}
            <div className="relative rounded-lg overflow-hidden border border-[#23252a] bg-[#08090a] aspect-video flex items-center justify-center group">
              {/* Native HTML5 Video Element streaming high-def CDN video */}
              <video
                ref={videoRef}
                src={sceneData[activeScene].videoUrl}
                poster={sceneData[activeScene].fallbackPoster}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted={isMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
              />

              {/* Viewport Top HUD */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none text-[10px] font-mono z-10">
                <span className="px-2 py-1 rounded bg-[#08090a]/80 backdrop-blur-md border border-[#23252a] text-[#d0d6e0]">
                  3840×2160 • CDN 60fps Stream
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-1 rounded bg-[#08090a]/80 backdrop-blur-md border border-[#23252a] text-[#8a8f98]">
                    {sceneData[activeScene].lens}
                  </span>
                  <span className="px-2 py-1 rounded bg-[#08090a]/80 backdrop-blur-md border border-[#23252a] text-[#e4f222]">
                    SEED: {seed}
                  </span>
                </div>
              </div>

              {/* Audio Mute/Unmute Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="absolute bottom-3 right-3 z-10 p-2 rounded-md bg-[#08090a]/80 backdrop-blur-md border border-[#23252a] text-[#d0d6e0] hover:text-white hover:border-[#e4f222] transition-colors"
                title={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#e4f222]" />}
              </button>

              {/* Render Loading Overlay */}
              {isRendering && (
                <div className="absolute inset-0 bg-[#08090a]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                  <div className="w-full max-w-sm space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#ffffff] flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-[#e4f222] animate-spin" />
                        Generating Motion Latents...
                      </span>
                      <span className="text-[#e4f222] font-semibold">{renderProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#161718] rounded-full overflow-hidden border border-[#23252a]">
                      <div 
                        className="h-full bg-[#e4f222] transition-all duration-300 shadow-[0_0_12px_#e4f222]"
                        style={{ width: `${renderProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-[#8a8f98] font-mono">{renderStepText}</p>
                  </div>
                </div>
              )}

              {/* Center Play/Pause Badge */}
              <button 
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-transparent cursor-pointer"
                aria-label="Toggle Playback"
              >
                <div className="w-12 h-12 rounded-full bg-[#08090a]/70 border border-[#23252a] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-105">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </div>
              </button>
            </div>

            {/* Timeline Scrubber */}
            <div className="mt-4 pt-3 border-t border-[#1f2126] flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={togglePlay}
                    className="w-7 h-7 rounded bg-[#161718] border border-[#23252a] hover:border-[#383b3f] text-[#d0d6e0] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                  <span className="font-mono text-[11px] text-[#d0d6e0]">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div 
                  className="flex-1 h-3.5 bg-[#161718] rounded border border-[#23252a] relative flex items-center px-1 cursor-pointer"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-1 bg-[#e4f222] rounded-full"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  ></div>
                  <div 
                    className="w-2.5 h-2.5 bg-white border border-[#08090a] rounded-full absolute -translate-x-1/2 shadow"
                    style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  ></div>
                  <span className="absolute left-[0%] w-1 h-2 bg-[#8a8f98] rounded-sm"></span>
                  <span className="absolute left-[33%] w-1 h-2 bg-[#8a8f98] rounded-sm"></span>
                  <span className="absolute left-[66%] w-1 h-2 bg-[#8a8f98] rounded-sm"></span>
                  <span className="absolute left-[100%] -translate-x-full w-1 h-2 bg-[#8a8f98] rounded-sm"></span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#8a8f98]">
                  <span className="mono-badge">60 FPS</span>
                  <span className="mono-badge text-[#27a644]">CDN STREAM</span>
                </div>
              </div>

              {/* Instant Social Dispatch Strip */}
              <div className="p-2.5 rounded-lg bg-[#0c0d0e] border border-[#23252a] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[11px] text-[#8a8f98]">Auto-Publish to:</span>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-[#161718] border border-[#23252a] text-[#02b8cc]">TikTok</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#161718] border border-[#23252a] text-[#eb5757]">Reels</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#161718] border border-[#23252a] text-[#eb5757]">Shorts</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#161718] border border-[#23252a] text-[#ffffff]">𝕏</span>
                  </div>
                </div>

                <button
                  onClick={handleQuickSocialPublish}
                  disabled={isSocialPublishing}
                  className="px-3 py-1 rounded bg-[#161718] hover:bg-[#23252a] border border-[#23252a] hover:border-[#e4f222] text-[11px] text-[#e4f222] flex items-center gap-1.5 transition-all cursor-pointer w-full sm:w-auto justify-center"
                >
                  {isSocialPublishing ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-[#e4f222]" />
                      <span>Syncing Channels...</span>
                    </>
                  ) : socialDone ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-[#27a644]" />
                      <span className="text-[#27a644]">Dispatched to All 4</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3 text-[#e4f222]" />
                      <span>1-Click Auto-Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar Control Center (5 Cols) */}
          <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between space-y-5 bg-[#0f1011]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#ffffff] tracking-tight">
                  Director Prompt
                </label>
                <button 
                  onClick={handleEnhancePrompt}
                  disabled={isEnhanced}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans transition-all cursor-pointer ${
                    isEnhanced 
                      ? "bg-[#27a644]/10 text-[#27a644] border border-[#27a644]/30" 
                      : "bg-[#161718] text-[#e4f222] border border-[#23252a] hover:border-[#e4f222]/40"
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isEnhanced ? "Enhanced" : "Auto-Enhance"}</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-[#161718] border border-[#23252a] focus:border-[#e4f222] rounded-md p-3 text-xs text-[#ffffff] placeholder-[#62666d] outline-none font-sans resize-none transition-colors"
                placeholder="Describe cinematic scene, camera optics, motion, and lighting..."
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(Object.keys(sceneData) as Array<keyof typeof sceneData>).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleSelectScene(key)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-sans transition-all cursor-pointer ${
                      activeScene === key 
                        ? "bg-[#e4f222] text-[#08090a] font-medium" 
                        : "bg-[#161718] border border-[#23252a] text-[#8a8f98] hover:text-[#ffffff] hover:border-[#383b3f]"
                    }`}
                  >
                    {sceneData[key].title}
                  </button>
                ))}
              </div>
            </div>

            {/* Camera Motion Trajectory Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#ffffff]">6-DoF Camera Trajectory</span>
                <span className="font-mono text-[11px] text-[#e4f222]">{cameraMotion}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Orbit Arc (3D)", icon: "🔄", desc: "Smooth 360° Spline" },
                  { name: "Dolly Zoom (Vertigo)", icon: "🔭", desc: "Focal Shift" },
                  { name: "Crane Pan Left", icon: "📐", desc: "Linear Pan" },
                  { name: "FPV High-Speed Dive", icon: "⚡", desc: "Fast Forward" }
                ].map((cam) => (
                  <button
                    key={cam.name}
                    onClick={() => setCameraMotion(cam.name)}
                    className={`p-2 rounded-md border text-left flex items-start gap-2 transition-all cursor-pointer ${
                      cameraMotion === cam.name
                        ? "bg-[#161718] border-[#e4f222] text-[#ffffff]"
                        : "bg-[#161718]/50 border-[#23252a] text-[#8a8f98] hover:border-[#383b3f] hover:text-[#d0d6e0]"
                    }`}
                  >
                    <span className="text-sm">{cam.icon}</span>
                    <div>
                      <div className="text-[11px] font-medium text-[#ffffff]">{cam.name}</div>
                      <div className="text-[10px] text-[#62666d]">{cam.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio & Format */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#ffffff]">Target Format</span>
                <span className="font-mono text-[11px] text-[#8a8f98]">{aspectRatio}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(["16:9", "9:16", "1:1", "2.39:1"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 rounded text-[11px] font-mono text-center border transition-all cursor-pointer ${
                      aspectRatio === ratio
                        ? "bg-[#ffffff] text-[#08090a] font-medium border-[#ffffff]"
                        : "bg-[#161718] border-[#23252a] text-[#8a8f98] hover:text-[#ffffff] hover:border-[#383b3f]"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#8a8f98]">Motion Dynamics</span>
                  <span className="font-mono text-[#ffffff]">{motionIntensity.toFixed(1)} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={motionIntensity}
                  onChange={(e) => setMotionIntensity(parseFloat(e.target.value))}
                  className="w-full accent-[#e4f222] bg-[#23252a] h-1 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#8a8f98]">Temporal Optical Lock</span>
                  <span className="font-mono text-[#27a644]">{coherence.toFixed(1)} (Coherent)</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="10"
                  step="0.1"
                  value={coherence}
                  onChange={(e) => setCoherence(parseFloat(e.target.value))}
                  className="w-full accent-[#27a644] bg-[#23252a] h-1 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Primary Action Button (Electric Acid Lime CTA) */}
            <button
              onClick={handleGenerate}
              disabled={isRendering}
              className="btn-acid-lime w-full py-3 text-sm cursor-pointer mt-2"
            >
              {isRendering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#08090a]" />
                  <span>Synthesizing Video...</span>
                </>
              ) : (
                <>
                  <span>Synthesize &amp; Auto-Reframe (⌘↵)</span>
                  <Film className="w-4 h-4 text-[#08090a]" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="hero-gradient-floor" aria-hidden="true"></div>
    </section>
  );
}
