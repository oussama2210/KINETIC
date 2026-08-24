"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ShortVideoPlayer from "@/components/short-video-player";
import {
  ArrowLeft,
  RefreshCw,
  Check,
  XCircle,
  Upload,
  Lock,
  AudioLines,
  Captions,
  Film,
  Zap,
  FileText,
  Clock,
} from "lucide-react";

interface ShortClipData {
  id: string;
  title: string;
  videoUrl: string;
  duration?: string;
  viralityScore?: number;
  transcriptSnippet?: string;
  aspectRatio?: string;
}

interface GeneratedShortData {
  id: string;
  rank: number;
  title: string;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  whyBestReason?: string | null;
  hookReason?: string | null;
  seoRanking?: number | null;
  viralRationale?: string | null;
  startCaption?: string | null;
  endCaption?: string | null;
  captions?: CaptionCue[] | null;
  transcriptExcerpt?: string | null;
  viralityScore?: number | null;
}

interface CaptionCue {
  start: number;
  end: number;
  text: string;
  index?: number;
}

interface ProjectStatus {
  id: string;
  status: string;
  progress: number;
  currentStep?: string;
  signedUrl?: string;
  title?: string;
  originalFileName?: string;
  errorMessage?: string;
  transcription?: string | null;
  captions?: CaptionCue[] | null;
  shorts?: ShortClipData[];
  generatedShorts?: GeneratedShortData[];
}

const PIPELINE_STEPS = [
  { threshold: 20, label: "Supabase Upload", icon: Upload },
  { threshold: 40, label: "Signed URL Saved", icon: Lock },
  { threshold: 70, label: "Deepgram Transcription", icon: AudioLines },
  { threshold: 100, label: "Captions & Shorts Ready", icon: Captions },
];

export default function ProjectAnalysisPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const [project, setProject] = useState<ProjectStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;

    const poll = async () => {
      pollCountRef.current += 1;
      // Stop after ~5 minutes of polling
      if (pollCountRef.current > 150) {
        stop();
        setError("Analysis is taking longer than expected — check the Inngest dashboard.");
        return;
      }

      try {
        const res = await fetch(`/api/video/status/${projectId}`, { cache: "no-store" });
        const data = await res.json();

        if (!data?.project || cancelled) return;
        setProject(data.project);

        if (data.project.status === "COMPLETED") {
          stop();
        }
      } catch (e) {
        console.warn("Project status polling notice:", e);
      }
    };

    const stop = () => {
      setIsPolling(false);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    poll();
    pollRef.current = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      stop();
    };
  }, [projectId]);

  const isCompleted = project?.status === "COMPLETED";
  const isFailed = project?.status === "FAILED";
  const progress = project?.progress ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23252a] pb-4">
        <div className="space-y-1">
          <Link
            href="/dashboard?tab=home"
            className="inline-flex items-center gap-1.5 text-[11px] text-[#8a8f98] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Studio</span>
          </Link>
          <h1 className="text-2xl font-[510] text-white tracking-tight">
            AI Analysis Workspace
          </h1>
          <p className="text-xs text-[#8a8f98] font-mono">
            Project <span className="text-[#02b8cc]">{projectId}</span>
            {project?.originalFileName ? ` • ${project.originalFileName}` : ""}
          </p>
        </div>

        <span
          className={`mono-badge text-[10px] px-3 py-1 ${
            isCompleted
              ? "text-[#27a644]"
              : isFailed
                ? "text-[#eb5757]"
                : "text-[#e4f222]"
          }`}
        >
          {isCompleted ? "COMPLETED" : isFailed ? "FAILED" : "ANALYSING"}
        </span>
      </div>

      {/* Progress / Loading Panel */}
      {!isCompleted && (
        <div className="hairline-card p-6 space-y-6 bg-[#0f1011] border border-[#23252a] rounded-xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#23252a] pb-3">
            <div className="flex items-center gap-2">
              <RefreshCw
                className={`w-4 h-4 text-[#e4f222] ${!isFailed ? "animate-spin" : ""}`}
              />
              <span className="text-sm font-[510] text-white">
                {error
                  ? "Polling Stopped"
                  : isFailed
                    ? "AI Analysis Failed"
                    : "Deepgram AI Pipeline Running..."}
              </span>
            </div>
            <span className="text-xs font-mono text-[#e4f222] font-semibold">
              {progress}%
            </span>
          </div>

          {/* Live Step Message */}
          <div className="p-4 rounded-lg bg-[#08090a] border border-[#23252a] flex items-center gap-3">
            <span
              className={`w-2 h-2 rounded-full ${
                isFailed ? "bg-[#eb5757]" : "bg-[#e4f222] animate-pulse"
              }`}
            />
            <span className="text-xs text-[#d0d6e0] font-mono">
              {error ||
                project?.errorMessage ||
                project?.currentStep ||
                "Waiting for first workflow event..."}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-2.5 bg-[#161718] rounded-full overflow-hidden border border-[#23252a]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isFailed
                    ? "bg-[#eb5757]"
                    : "bg-gradient-to-r from-[#27a644] via-[#02b8cc] to-[#e4f222] shadow-[0_0_12px_rgba(228,242,34,0.4)]"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Pipeline */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
            {PIPELINE_STEPS.map((step, idx) => {
              const done = progress >= step.threshold && !isFailed;
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border ${
                    done
                      ? "bg-[#27a644]/10 border-[#27a644]/30 text-[#27a644]"
                      : "bg-[#161718] border-[#23252a] text-[#8a8f98]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {done ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                    <span>{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed: Transcript + Captions + Shorts */}
      {isCompleted && project && (
        <>
          {/* Transcript Result */}
          <div className="hairline-card p-6 space-y-4 bg-[#0f1011] border border-[#23252a] rounded-xl">
            <div className="flex items-center justify-between border-b border-[#23252a] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#e4f222]" />
                <h3 className="text-sm font-[510] text-white">
                  Deepgram Transcript
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#27a644] flex items-center gap-1">
                <Check className="w-3 h-3" />
                Analysis Complete
              </span>
            </div>
            <p className="text-xs text-[#d0d6e0] leading-relaxed whitespace-pre-wrap">
              {project.transcription || "No speech detected in this video."}
            </p>
          </div>

          {/* Generated Captions */}
          {Array.isArray(project.captions) && project.captions.length > 0 && (
            <div className="hairline-card p-6 space-y-4 bg-[#0f1011] border border-[#23252a] rounded-xl">
              <div className="flex items-center justify-between border-b border-[#23252a] pb-3">
                <div className="flex items-center gap-2">
                  <Captions className="w-4 h-4 text-[#02b8cc]" />
                  <h3 className="text-sm font-[510] text-white">
                    Synchronized Captions ({project.captions.length} cues)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#8a8f98]">
                  Word-timestamped subtitle cues
                </span>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {project.captions.map((cue, idx) => (
                  <div
                    key={cue.index ?? idx}
                    className="flex items-start gap-3 p-2 rounded bg-[#08090a] border border-[#23252a]/60"
                  >
                    <span className="text-[10px] font-mono text-[#02b8cc] flex-shrink-0 pt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {cue.start.toFixed(1)}s → {cue.end.toFixed(1)}s
                    </span>
                    <span className="text-[11px] text-white">{cue.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI-Selected Engaging Moments */}
          {Array.isArray(project.generatedShorts) && project.generatedShorts.length > 0 && (
            <div className="hairline-card p-6 space-y-4 bg-[#0f1011] border border-[#23252a] rounded-xl">
              <div className="flex items-center justify-between border-b border-[#23252a] pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#e4f222]" />
                  <h3 className="text-sm font-[510] text-white">
                    Gemini AI Selected Moments ({project.generatedShorts.length})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#8a8f98]">
                  Ranked by viral potential
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {project.generatedShorts.map((short) => (
                  <div
                    key={short.id}
                    className={`p-4 rounded-lg bg-[#08090a] space-y-3 ${
                      short.rank === 1
                        ? "border border-[#e4f222]/50 shadow-[0_0_16px_rgba(228,242,34,0.15)]"
                        : "border border-[#23252a]"
                    }`}
                  >
                    {/* Rank + Title + Timing */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 ${
                            short.rank === 1
                              ? "bg-[#e4f222] text-[#08090a]"
                              : "bg-[#161718] text-[#8a8f98] border border-[#23252a]"
                          }`}
                        >
                          {short.rank}
                        </span>
                        <div>
                          <h4 className="text-xs font-semibold text-white" title={short.title}>
                            {short.title}
                          </h4>
                          <span className="text-[10px] font-mono text-[#02b8cc]">
                            {short.startTimeSec.toFixed(1)}s → {short.endTimeSec.toFixed(1)}s
                            ({Math.round(short.durationSec)}s clip)
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#27a644] bg-[#27a644]/10 border border-[#27a644]/30 px-2 py-0.5 rounded flex-shrink-0">
                        SEO: {short.seoRanking ?? short.viralityScore ?? 90}/100
                      </span>
                    </div>

                    {/* Why best short video */}
                    <div className="p-2.5 rounded bg-[#0c0d0e] border border-[#23252a]/60">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#e4f222] block mb-1">
                        Why this is the best short video
                      </span>
                      <p className="text-[11px] text-[#d0d6e0] leading-relaxed">
                        {short.whyBestReason || short.hookReason}
                      </p>
                    </div>

                    {/* Viral ranking rationale */}
                    {short.viralRationale && (
                      <div className="p-2.5 rounded bg-[#0c0d0e] border border-[#23252a]/60">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#02b8cc] block mb-1">
                          Algorithm &amp; SEO Rationale
                        </span>
                        <p className="text-[11px] text-[#d0d6e0] leading-relaxed">{short.viralRationale}</p>
                      </div>
                    )}

                    {/* Start / End captions */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-[#121315] border border-[#23252a]/60">
                        <span className="text-[9px] font-mono uppercase text-[#62666d] block mb-0.5">
                          Start Caption
                        </span>
                        <span className="text-[11px] font-bold text-[#e4f222]">{short.startCaption || "—"}</span>
                      </div>
                      <div className="p-2 rounded bg-[#121315] border border-[#23252a]/60">
                        <span className="text-[9px] font-mono uppercase text-[#62666d] block mb-0.5">
                          End Caption (CTA)
                        </span>
                        <span className="text-[11px] font-bold text-[#02b8cc]">{short.endCaption || "—"}</span>
                      </div>
                    </div>

                    {short.transcriptExcerpt && (
                      <p className="text-[10px] text-[#8a8f98] italic line-clamp-2">
                        “{short.transcriptExcerpt}”
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Short Video Players with Trim + Captions */}
          {Array.isArray(project.generatedShorts) && project.generatedShorts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#23252a] pb-3">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#27a644]" />
                  <h3 className="text-sm font-[510] text-white">
                    AI Short Video Previews ({project.generatedShorts.length})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#e4f222]">
                  Trimmed &amp; Captioned
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {project.generatedShorts.map((short) => {
                  // Use the source video URL (original uploaded video) for trim playback
                  const sourceUrl = short.videoUrl || project.signedUrl || "";
                  // Parse captions — they're stored as JSON in the DB
                  const clipCaptions = Array.isArray(short.captions)
                    ? (short.captions as { start: number; end: number; text: string }[])
                    : [];

                  return (
                    <div
                      key={short.id}
                      className="rounded-xl bg-[#0c0d0e] border border-[#23252a] hover:border-[#e4f222]/50 transition-all overflow-hidden flex flex-col"
                    >
                      {/* Trim-Playback Video Player with Caption Overlay */}
                      <ShortVideoPlayer
                        sourceVideoUrl={sourceUrl}
                        startTimeSec={short.startTimeSec}
                        endTimeSec={short.endTimeSec}
                        captions={clipCaptions}
                        title={short.title}
                        startCaption={short.startCaption || undefined}
                        endCaption={short.endCaption || undefined}
                      />

                      {/* Card Meta */}
                      <div className="p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-white truncate flex-1 mr-2" title={short.title}>
                            {short.title}
                          </h4>
                          <span className="text-[10px] font-mono text-[#27a644] bg-[#27a644]/10 border border-[#27a644]/30 px-2 py-0.5 rounded flex-shrink-0">
                            SEO: {short.seoRanking ?? short.viralityScore ?? 90}/100
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#8a8f98]">
                          <span>9:16 Vertical</span>
                          <span>
                            {short.startTimeSec.toFixed(1)}s → {short.endTimeSec.toFixed(1)}s
                            ({Math.round(short.durationSec)}s)
                          </span>
                        </div>
                        {(short.whyBestReason || short.hookReason) && (
                          <p className="text-[10px] text-[#8a8f98] line-clamp-2 mt-1">
                            {short.whyBestReason || short.hookReason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
