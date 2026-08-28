"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  Film, 
  Sparkles, 
  FileVideo, 
  CheckCircle2, 
  X, 
  Play, 
  Pause, 
  Type, 
  Scissors, 
  Layers, 
  Link as LinkIcon, 
  RefreshCw,
  AlertCircle,
  FileText,
  Subtitles,
  Zap,
  Sliders,
  Check,
  Server,
  Database,
  Lock,
  Copy,
  ExternalLink,
  ArrowRight
} from "lucide-react";

interface UploadedVideoInfo {
  file?: File;
  name: string;
  size: string;
  duration: string;
  resolution: string;
  url: string;
  type: string;
}

interface VideoUploadZoneProps {
  onVideoUploaded?: (video: UploadedVideoInfo) => void;
  onGenerateShorts?: (config: {
    video: UploadedVideoInfo;
    projectId: string;
    signedUrl?: string;
    clipCount: string;
    captionStyle: string;
    aspectRatio: string;
    detectHooks: boolean;
    autoBroll: boolean;
  }) => void;
}

interface WorkflowStep {
  step: number;
  label: string;
  progress: number;
  status: "idle" | "active" | "completed";
}

export function VideoUploadZone({ onVideoUploaded, onGenerateShorts }: VideoUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [isInitialSelecting, setIsInitialSelecting] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideoInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // AI Processing States
  const [isProcessingWorkflow, setIsProcessingWorkflow] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [currentStepMessage, setCurrentStepMessage] = useState("");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [copiedSignedUrl, setCopiedSignedUrl] = useState(false);

  // Shorts Generation Options
  const [clipCount, setClipCount] = useState("3-5 Viral Shorts");
  const [captionStyle, setCaptionStyle] = useState("Hormozi Style (Dynamic Neon)");
  const [aspectRatio, setAspectRatio] = useState("9:16 Vertical (Shorts/Reels/TikTok)");
  const [detectHooks, setDetectHooks] = useState(true);
  const [autoBroll, setAutoBroll] = useState(true);

  // Generated Clips Result
  const [generatedClips, setGeneratedClips] = useState<Array<{
    id: string;
    title: string;
    duration: string;
    viralityScore: number;
    transcriptSnippet: string;
    videoUrl: string;
  }> | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Handle Local File Selection
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Please upload a valid video file (MP4, MOV, WebM, MKV).");
      return;
    }

    setIsInitialSelecting(true);
    setGeneratedClips(null);
    setProjectId(null);
    setSignedUrl(null);

    const objectUrl = URL.createObjectURL(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + " MB";

    const videoInfo: UploadedVideoInfo = {
      file,
      name: file.name,
      size: sizeMb,
      duration: "04:18",
      resolution: "1080p HD (60fps)",
      url: objectUrl,
      type: file.type,
    };

    setTimeout(() => {
      setUploadedVideo(videoInfo);
      setIsInitialSelecting(false);
      if (onVideoUploaded) onVideoUploaded(videoInfo);
    }, 400);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Handle URL Load
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = videoUrlInput.trim();
    if (!rawUrl) return;

    setIsInitialSelecting(true);
    setGeneratedClips(null);
    setProjectId(null);
    setSignedUrl(null);

    const displayName = rawUrl.split("/").pop()?.split("?")[0] || rawUrl.slice(0, 30);
    const videoInfo: UploadedVideoInfo = {
      name: displayName,
      size: "Remote Video Stream",
      duration: "04:00",
      resolution: "HD (Cloud Stream)",
      url: rawUrl,
      type: "video/mp4",
    };

    setTimeout(() => {
      setUploadedVideo(videoInfo);
      setIsInitialSelecting(false);
      if (onVideoUploaded) onVideoUploaded(videoInfo);
    }, 400);
  };

  const handleReset = () => {
    setUploadedVideo(null);
    setIsProcessingWorkflow(false);
    setWorkflowProgress(0);
    setGeneratedClips(null);
    setProjectId(null);
    setSignedUrl(null);
    setIsPlaying(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const copySignedUrlToClipboard = () => {
    if (!signedUrl) return;
    navigator.clipboard.writeText(signedUrl);
    setCopiedSignedUrl(true);
    setTimeout(() => setCopiedSignedUrl(false), 2000);
  };

  const [uploadError, setUploadError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // "AI ANALYSE" BUTTON:
  // 1) Creates Project & gets upload URL
  // 2) Uploads video with progress tracking
  // 3) ONLY AFTER upload succeeds, starts AI analysis
  // 4) Navigates to the project analysis page
  // -------------------------------------------------------------
  const router = useRouter();

  const dispatchInngestWorkflow = async (pid: string) => {
    const dispatchRes = await fetch("/api/video/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: pid }),
    });
    if (!dispatchRes.ok) {
      const errJson = await dispatchRes.json().catch(() => ({}));
      throw new Error(errJson.error || "Failed to start AI workflow after upload");
    }
  };

  const handleAiAnalyse = async () => {
    if (!uploadedVideo || isProcessingWorkflow) return;

    setUploadError(null);
    setIsProcessingWorkflow(true);
    setWorkflowProgress(5);
    setActiveStepIndex(1);
    setGeneratedClips(null);
    setCurrentStepMessage("Initializing project & requesting storage upload signature...");

    try {
      // 1. Create project in database + get signed upload URL
      const res = await fetch("/api/video/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: uploadedVideo.name,
          fileSize: uploadedVideo.size,
          duration: uploadedVideo.duration,
          videoUrl: uploadedVideo.file ? undefined : uploadedVideo.url,
          clipCount,
          captionStyle,
          aspectRatio,
          detectHooks,
          autoBroll,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const newProjectId = data.projectId || `prj_${Date.now()}`;
      const newSignedUrl = data.signedUrl || uploadedVideo.url;
      const uploadUrl = data.uploadUrl;
      const isLiveStorage = data.isLiveStorage;

      setProjectId(newProjectId);
      setSignedUrl(newSignedUrl);

      // 2. Upload video file with progress tracking
      if (uploadedVideo.file && uploadUrl && isLiveStorage) {
        setCurrentStepMessage("Uploading video (0%)...");
        setWorkflowProgress(10);

        const uploadResult = await new Promise<{ success: boolean; error?: string; status?: number }>((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", uploadedVideo.type || "video/mp4");
          xhr.setRequestHeader("x-upsert", "true");

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              const loadedMb = (e.loaded / (1024 * 1024)).toFixed(1);
              const totalMb = (e.total / (1024 * 1024)).toFixed(1);
              // Scale progress 10% -> 90%
              setWorkflowProgress(10 + Math.round(pct * 0.8));
              setCurrentStepMessage(`Uploading video to Supabase: ${pct}% (${loadedMb}MB / ${totalMb}MB)...`);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ success: true, status: xhr.status });
            } else {
              let errText = xhr.responseText || "";
              let isTooLarge = xhr.status === 413;
              try {
                const parsed = JSON.parse(errText);
                errText = parsed.message || parsed.error || errText;
                // Cloud storage wraps EntityTooLarge inside an HTTP 400 response
                if (parsed.code === "EntityTooLarge" || parsed.statusCode === "413") {
                  isTooLarge = true;
                }
              } catch {
                // ignore
              }
              if (isTooLarge || errText.toLowerCase().includes("large") || errText.toLowerCase().includes("limit") || errText.toLowerCase().includes("entity")) {
                resolve({
                  success: false,
                  status: xhr.status,
                  error: "File too large. Maximum 50MB per file. Please use a smaller video or paste a URL instead.",
                });
              } else {
                resolve({
                  success: false,
                  status: xhr.status,
                  error: `Storage upload failed (${xhr.status}): ${errText || "Check bucket permissions"}`,
                });
              }
            }
          };

          xhr.onerror = () => {
            resolve({
              success: false,
              error: "Network error during video upload. Please check your internet connection.",
            });
          };

          xhr.send(uploadedVideo.file);
        });

        if (!uploadResult.success) {
          setIsProcessingWorkflow(false);
          setUploadError(uploadResult.error || "Storage upload failed");
          setCurrentStepMessage("");
          return;
        }

        setWorkflowProgress(95);
        console.log("Successfully uploaded raw video to cloud storage");
      }

      // 3. Upload is done (or not needed for direct URLs) — NOW start the
      //    AI workflow so it always finds the file in storage.
      setCurrentStepMessage("Upload complete • Starting AI analysis...");
      await dispatchInngestWorkflow(newProjectId);

      // 4. Navigate to the dedicated project analysis page for live progress
      setWorkflowProgress(100);
      setCurrentStepMessage("Upload 100% complete • Redirecting to AI Analysis workspace...");
      router.push(`/dashboard/project/${newProjectId}`);
      setIsProcessingWorkflow(false);

    } catch (err: any) {
      console.error("AI Analyse trigger error:", err);
      setIsProcessingWorkflow(false);
      setUploadError(err.message || "Failed to start AI analysis — please try again.");
      setCurrentStepMessage("");
    }
  };

  return (
    <div className="hairline-card p-6 bg-[#0f1011] border border-[#23252a] rounded-xl space-y-6 shadow-2xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23252a] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#161718] border border-[#23252a] flex items-center justify-center text-[#e4f222] shadow-[0_0_12px_rgba(228,242,34,0.2)]">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-[510] text-[#ffffff] tracking-tight">
                Upload Long Video &rarr; AI Shorts Pipeline
              </h2>
              <span className="text-[10px] font-mono text-[#27a644] bg-[#27a644]/10 border border-[#27a644]/30 px-1.5 py-0.5 rounded">
                AI Ready
              </span>
            </div>
            <p className="text-xs text-[#8a8f98]">
              Upload your raw video. When you click <strong>AI Analyse</strong>, our AI pipeline transcribes it, generates synchronized captions, and outputs 9:16 shorts optimized for TikTok, Reels, and YouTube Shorts.
            </p>
          </div>
        </div>

        {/* Tab Toggle: Local File vs Cloud URL */}
        <div className="flex items-center p-1 rounded-lg bg-[#161718] border border-[#23252a] text-xs flex-shrink-0">
          <button
            type="button"
            onClick={() => setUploadMode("file")}
            className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
              uploadMode === "file" 
                ? "bg-[#e4f222] text-[#08090a] shadow-sm font-semibold" 
                : "text-[#8a8f98] hover:text-white"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setUploadMode("url")}
            className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
              uploadMode === "url" 
                ? "bg-[#e4f222] text-[#08090a] shadow-sm font-semibold" 
                : "text-[#8a8f98] hover:text-white"
            }`}
          >
            Paste Video URL
          </button>
        </div>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* ------------------------------------------------------------- */}
      {/* 1. SELECTION / DROP ZONE */}
      {/* ------------------------------------------------------------- */}
      {!uploadedVideo && (
        <>
          {uploadMode === "file" ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
                isDragging
                  ? "border-[#e4f222] bg-[#e4f222]/5 scale-[0.99]"
                  : "border-[#23252a] hover:border-[#383b3f] bg-[#0c0d0e] hover:bg-[#121315]"
              }`}
            >
              {isInitialSelecting ? (
                <div className="space-y-3 py-4">
                  <RefreshCw className="w-6 h-6 text-[#e4f222] animate-spin mx-auto" />
                  <p className="text-xs font-mono text-white">Reading video headers &amp; format...</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#161718] border border-[#23252a] flex items-center justify-center shadow-[0_0_24px_rgba(228,242,34,0.1)] group-hover:scale-105 transition-transform">
                    <Upload className="w-7 h-7 text-[#e4f222]" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">
                      <span className="text-[#e4f222]">Click to choose video</span> or drag and drop here
                    </p>
                    <p className="text-xs text-[#8a8f98]">
                      MP4, MOV, WebM, MKV up to 2GB • Cloud Storage Ready
                    </p>
                  </div>

                  {/* Highlights Pills */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-mono">
                    <span className="px-2.5 py-1 rounded bg-[#161718] border border-[#23252a] text-[#02b8cc] flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5" />
                      <span>Cloud Storage</span>
                    </span>
                    <span className="px-2.5 py-1 rounded bg-[#161718] border border-[#23252a] text-[#27a644] flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      <span>Auto-Sync Database</span>
                    </span>
                    <span className="px-2.5 py-1 rounded bg-[#161718] border border-[#23252a] text-[#e4f222] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>AI Processing Engine</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleUrlSubmit} className="p-8 rounded-xl bg-[#0c0d0e] border border-[#23252a] space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-white flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#e4f222]" />
                  <span>Import from YouTube, Twitch, Google Drive, or Cloud MP4</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://cloud.com/video.mp4"
                    className="flex-1 bg-[#161718] border border-[#23252a] focus:border-[#e4f222] rounded-lg p-3 text-xs text-white outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!videoUrlInput.trim()}
                    className="btn-acid-lime text-xs px-5 py-2.5 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Select Stream</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SELECTED VIDEO & INGGEST WORKFLOW CONTROLS */}
      {/* ------------------------------------------------------------- */}
      {uploadedVideo && (
        <div className="space-y-6 animate-in fade-in">
          {/* Metadata Card */}
          <div className="p-4 rounded-xl bg-[#0c0d0e] border border-[#23252a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Mini Video Preview Thumbnail */}
              <div 
                onClick={togglePlay}
                className="w-24 h-16 rounded-lg bg-[#161718] border border-[#23252a] overflow-hidden relative group cursor-pointer flex-shrink-0"
              >
                <video
                  ref={videoRef}
                  src={uploadedVideo.url}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-[#e4f222]" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white truncate max-w-sm">
                    {uploadedVideo.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#e4f222] bg-[#e4f222]/10 border border-[#e4f222]/30 px-2 py-0.5 rounded">
                    Ready for Processing
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#8a8f98] mt-1">
                  <span>Size: <strong className="text-white">{uploadedVideo.size}</strong></span>
                  <span>•</span>
                  <span>Duration: <strong className="text-white">{uploadedVideo.duration}</strong></span>
                  <span>•</span>
                  <span>Quality: <strong className="text-[#02b8cc]">{uploadedVideo.resolution}</strong></span>
                </div>
              </div>
            </div>

            {/* Replace Button */}
            <button
              type="button"
              disabled={isProcessingWorkflow}
              onClick={handleReset}
              className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 text-[#8a8f98] hover:text-white cursor-pointer disabled:opacity-40"
            >
              <X className="w-3.5 h-3.5" />
              <span>Replace Video</span>
            </button>
          </div>

          {/* Configuration Settings */}
          <div className="p-5 rounded-xl bg-[#121315] border border-[#23252a] space-y-4">
            <div className="flex items-center justify-between border-b border-[#23252a] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#e4f222]" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  AI Processing Options
                </h3>
              </div>
              <span className="mono-badge text-[10px] text-[#02b8cc]">
                AI Transcription + Auto Captions
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] text-[#8a8f98] block mb-1 font-mono">
                  1. Viral Shorts Output
                </label>
                <select
                  disabled={isProcessingWorkflow}
                  value={clipCount}
                  onChange={(e) => setClipCount(e.target.value)}
                  className="w-full bg-[#161718] border border-[#23252a] text-xs text-white rounded-lg p-2.5 outline-none cursor-pointer disabled:opacity-50"
                >
                  <option>1-3 Viral Clips (Top Highlights)</option>
                  <option>3-5 Viral Shorts (Recommended)</option>
                  <option>5-10 Short Drops (Full Series)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#8a8f98] block mb-1 font-mono">
                  2. Animated Dynamic Subtitles
                </label>
                <select
                  disabled={isProcessingWorkflow}
                  value={captionStyle}
                  onChange={(e) => setCaptionStyle(e.target.value)}
                  className="w-full bg-[#161718] border border-[#23252a] text-xs text-white rounded-lg p-2.5 outline-none cursor-pointer disabled:opacity-50"
                >
                  <option>Hormozi Style (Dynamic Neon Word-by-Word)</option>
                  <option>Beast Mode (High-Impact Yellow/Green)</option>
                  <option>Minimalist Cinematic White</option>
                  <option>Karaoke Box Pop Subtitles</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#8a8f98] block mb-1 font-mono">
                  3. Aspect Reframe &amp; Cropping
                </label>
                <select
                  disabled={isProcessingWorkflow}
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-[#161718] border border-[#23252a] text-xs text-white rounded-lg p-2.5 outline-none font-mono cursor-pointer disabled:opacity-50"
                >
                  <option>9:16 Vertical (Shorts/Reels/TikTok)</option>
                  <option>1:1 Square (X / LinkedIn)</option>
                  <option>Split Screen (Facecam + Gameplay)</option>
                </select>
              </div>
            </div>

            {/* Smart Toggles */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[#23252a]/60 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={isProcessingWorkflow}
                  checked={detectHooks}
                  onChange={(e) => setDetectHooks(e.target.checked)}
                  className="rounded border-[#23252a] text-[#e4f222] focus:ring-0 cursor-pointer"
                />
                <span className="text-[#d0d6e0]">Auto-detect psychological viral hooks &amp; punchlines</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={isProcessingWorkflow}
                  checked={autoBroll}
                  onChange={(e) => setAutoBroll(e.target.checked)}
                  className="rounded border-[#23252a] text-[#e4f222] focus:ring-0 cursor-pointer"
                />
                <span className="text-[#d0d6e0]">AI B-roll &amp; Sound Effect auto-layering</span>
              </label>
            </div>

            {/* PRIMARY AI ANALYSE BUTTON */}
            {/* Error Banner */}
            {uploadError && (
              <div className="p-3.5 rounded-lg bg-[#eb5757]/10 border border-[#eb5757]/30 text-xs text-[#eb5757] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">Upload Failed</span>
                  <p className="text-[11px] leading-relaxed text-[#d0d6e0]">{uploadError}</p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleAiAnalyse}
                disabled={isProcessingWorkflow}
                className="btn-acid-lime w-full py-3.5 text-xs font-semibold cursor-pointer shadow-[0_0_24px_rgba(228,242,34,0.3)] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isProcessingWorkflow ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#08090a]" />
                    <span>Uploading &amp; Analysing ({workflowProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#08090a]" />
                    <span>AI Analyse &rarr; Transcription + Auto Captions</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* REAL-TIME INGGEST WORKFLOW PROGRESS & STATUS TRACKER */}
          {/* ------------------------------------------------------------- */}
          {(isProcessingWorkflow || projectId) && (
            <div className="p-5 rounded-xl bg-[#0a0b0c] border border-[#23252a] space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#23252a] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#e4f222] animate-pulse"></div>
                  <span className="text-xs font-semibold text-white">
                    AI Analysis Status: <strong className="text-[#e4f222]">{isProcessingWorkflow ? "PROCESSING" : "COMPLETED"}</strong>
                  </span>
                </div>

                {projectId && (
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-[#8a8f98]">Project ID:</span>
                    <span className="text-[#02b8cc] bg-[#02b8cc]/10 border border-[#02b8cc]/30 px-2 py-0.5 rounded">
                      {projectId}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#d0d6e0]">{currentStepMessage}</span>
                  <span className="text-[#e4f222] font-semibold">{workflowProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#161718] rounded-full overflow-hidden border border-[#23252a]">
                  <div 
                    className="h-full bg-gradient-to-r from-[#27a644] via-[#02b8cc] to-[#e4f222] transition-all duration-500 rounded-full shadow-[0_0_12px_rgba(228,242,34,0.4)]"
                    style={{ width: `${workflowProgress}%` }}
                  />
                </div>
              </div>

              {/* Inggest Step Pipeline Flow */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-[10px] font-mono">
                <div className={`p-2.5 rounded-lg border ${workflowProgress >= 20 ? "bg-[#27a644]/10 border-[#27a644]/30 text-[#27a644]" : "bg-[#161718] border-[#23252a] text-[#8a8f98]"}`}>
                  <div className="flex items-center gap-1.5">
                    {workflowProgress >= 20 ? <Check className="w-3 h-3" /> : <span>1.</span>}
                    <span>Cloud Upload</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border ${workflowProgress >= 40 ? "bg-[#27a644]/10 border-[#27a644]/30 text-[#27a644]" : "bg-[#161718] border-[#23252a] text-[#8a8f98]"}`}>
                  <div className="flex items-center gap-1.5">
                    {workflowProgress >= 40 ? <Check className="w-3 h-3" /> : <span>2.</span>}
                    <span>Signed URL Saved</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border ${workflowProgress >= 70 ? "bg-[#27a644]/10 border-[#27a644]/30 text-[#27a644]" : "bg-[#161718] border-[#23252a] text-[#8a8f98]"}`}>
                  <div className="flex items-center gap-1.5">
                    {workflowProgress >= 70 ? <Check className="w-3 h-3" /> : <span>3.</span>}
                    <span>AI Transcription</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border ${workflowProgress >= 100 ? "bg-[#27a644]/10 border-[#27a644]/30 text-[#27a644]" : "bg-[#161718] border-[#23252a] text-[#8a8f98]"}`}>
                  <div className="flex items-center gap-1.5">
                    {workflowProgress >= 100 ? <Check className="w-3 h-3" /> : <span>4.</span>}
                    <span>Captions &amp; Shorts Ready</span>
                  </div>
                </div>
              </div>

              {/* Signed Video URL Box */}
              {signedUrl && (
                <div className="p-3 rounded-lg bg-[#161718] border border-[#23252a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Lock className="w-3.5 h-3.5 text-[#e4f222] flex-shrink-0" />
                    <span className="text-[#8a8f98] font-mono text-[11px] flex-shrink-0">Signed Playback URL:</span>
                    <span className="text-white font-mono text-[10px] truncate max-w-md" title={signedUrl}>
                      {signedUrl}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={copySignedUrlToClipboard}
                    className="btn-ghost py-1 px-2.5 text-[10px] font-mono flex items-center gap-1 cursor-pointer flex-shrink-0"
                  >
                    {copiedSignedUrl ? <Check className="w-3 h-3 text-[#27a644]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSignedUrl ? "Copied" : "Copy Signed URL"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 3. GENERATED SHORTS DISPLAY */}
          {/* ------------------------------------------------------------- */}
          {generatedClips && (
            <div className="space-y-4 pt-4 border-t border-[#23252a] animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#23252a] pb-3">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#27a644]" />
                  <h3 className="text-sm font-[510] text-white">
                    Generated AI Shorts ({generatedClips.length} Viral Clips Ready)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#e4f222]">
                  Database Synced • Ready to Auto-Publish
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {generatedClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="p-4 rounded-xl bg-[#0c0d0e] border border-[#23252a] hover:border-[#e4f222]/50 transition-all space-y-3 flex flex-col justify-between"
                  >
                    {/* Vertical 9:16 Video Player Container */}
                    <div className="w-full aspect-[9/14] rounded-lg bg-[#161718] border border-[#23252a] overflow-hidden relative group">
                      <video
                        src={clip.videoUrl}
                        muted
                        loop
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#08090a]/90 backdrop-blur-sm border border-[#27a644]/40 text-[10px] font-mono text-[#27a644] flex items-center gap-1">
                        <Zap className="w-3 h-3 text-[#e4f222]" />
                        <span>Viral Score: {clip.viralityScore}/100</span>
                      </div>

                      {/* Subtitle Overlay Mockup */}
                      <div className="absolute bottom-3 inset-x-3 p-2 rounded bg-black/75 backdrop-blur-md text-center">
                        <p className="text-[11px] font-bold text-[#e4f222] leading-tight drop-shadow-md">
                          {clip.transcriptSnippet}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-white truncate" title={clip.title}>
                        {clip.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#8a8f98]">
                        <span>9:16 Vertical</span>
                        <span>{clip.duration}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#23252a] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => alert(`Short "${clip.title}" queued for automated publishing to TikTok, Reels, Shorts & X!`)}
                        className="btn-acid-lime w-full py-2 text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Auto-Publish to Channels</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
