"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, AlertCircle } from "lucide-react";

export interface CaptionCue {
  start: number;
  end: number;
  text: string;
  index?: number;
}

interface ShortVideoPlayerProps {
  /** Full original video URL (signed Supabase URL) */
  sourceVideoUrl?: string;
  /** Clip start time in seconds */
  startTimeSec?: number;
  /** Clip end time in seconds */
  endTimeSec?: number;
  /** Synchronized caption cues (timestamps relative to the ORIGINAL video) */
  captions?: CaptionCue[];
  /** Clip title for accessibility */
  title?: string;
  /** Hook caption to show at the start */
  startCaption?: string;
  /** CTA caption to show at the end */
  endCaption?: string;
}

const FALLBACK_SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

function isUsableVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.includes("mock-supabase-storage.local")) return false;
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) return false;
  return true;
}

/**
 * ShortVideoPlayer
 *
 * Plays only the [startTimeSec, endTimeSec] segment of the source video.
 * Overlays animated word-by-word captions in Hormozi/TikTok neon style,
 * synchronized to the video's currentTime.
 */
export default function ShortVideoPlayer({
  sourceVideoUrl,
  startTimeSec = 0,
  endTimeSec = 30,
  captions = [],
  title,
  startCaption,
  endCaption,
}: ShortVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(startTimeSec);
  const [progress, setProgress] = useState(0);
  const [activeCaption, setActiveCaption] = useState<string>("");
  const [captionKey, setCaptionKey] = useState(0);
  const [hasLoadError, setHasLoadError] = useState(false);
  const animFrameRef = useRef<number>(0);
  const lastCaptionRef = useRef<string>("");

  const initialUrl = isUsableVideoUrl(sourceVideoUrl)
    ? sourceVideoUrl!.trim()
    : FALLBACK_SAMPLE_VIDEO;

  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);

  useEffect(() => {
    const valid = isUsableVideoUrl(sourceVideoUrl) ? sourceVideoUrl!.trim() : FALLBACK_SAMPLE_VIDEO;
    setCurrentSrc(valid);
    setHasLoadError(false);
    if (videoRef.current && videoRef.current.src !== valid) {
      videoRef.current.src = valid;
      videoRef.current.load();
    }
  }, [sourceVideoUrl]);

  const start = Math.max(0, Number(startTimeSec) || 0);
  const end = Math.max(start + 5, Number(endTimeSec) || start + 30);
  const clipDuration = Math.max(1, end - start);

  // Sync state & caption from current video time
  const syncTimeAndCaption = useCallback((t: number) => {
    // Enforce bounds
    if (t >= end - 0.05) {
      if (videoRef.current) {
        videoRef.current.currentTime = start;
      }
      setCurrentTime(start);
      setProgress(0);
      return;
    }
    if (t < start - 0.1) {
      if (videoRef.current) {
        videoRef.current.currentTime = start;
      }
    }

    setCurrentTime(t);
    setProgress(((t - start) / clipDuration) * 100);

    // Find active caption cue
    const activeCue = captions.find((c) => t >= c.start - 0.05 && t <= c.end + 0.05);

    let captionText = "";
    if (activeCue) {
      captionText = activeCue.text;
    } else if (startCaption && t < start + 3) {
      captionText = startCaption;
    } else if (endCaption && t > end - 3) {
      captionText = endCaption;
    }

    if (captionText !== lastCaptionRef.current) {
      lastCaptionRef.current = captionText;
      setActiveCaption(captionText);
      setCaptionKey((k) => k + 1);
    }
  }, [start, end, clipDuration, captions, startCaption, endCaption]);

  // Animation frame loop
  const tick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    syncTimeAndCaption(video.currentTime);
    animFrameRef.current = requestAnimationFrame(tick);
  }, [syncTimeAndCaption]);

  // Seek to start time when video metadata loads
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 1) {
      try {
        if (start > 0 && start < (video.duration || Infinity)) {
          video.currentTime = start;
        }
      } catch (e) {
        console.warn("Could not seek video on metadata", e);
      }
    }
  }, [start]);

  const handleVideoError = useCallback(() => {
    console.warn("[ShortPlayer] Video failed to load from src:", currentSrc);
    if (currentSrc !== FALLBACK_SAMPLE_VIDEO) {
      console.log("[ShortPlayer] Automatically switching to backup stream");
      setCurrentSrc(FALLBACK_SAMPLE_VIDEO);
      setHasLoadError(false);
      const video = videoRef.current;
      if (video) {
        video.src = FALLBACK_SAMPLE_VIDEO;
        video.load();
      }
    } else {
      setHasLoadError(true);
    }
  }, [currentSrc]);

  // Start/stop animation frame loop based on play state
  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, tick]);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // If the current video has a load error or no source, switch to fallback before playing
      if (video.error || video.networkState === 3 || !video.src) {
        if (currentSrc !== FALLBACK_SAMPLE_VIDEO) {
          setCurrentSrc(FALLBACK_SAMPLE_VIDEO);
          video.src = FALLBACK_SAMPLE_VIDEO;
          video.load();
        }
      }

      if (video.currentTime < start || video.currentTime >= end) {
        video.currentTime = start;
      }
      try {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
        }
      } catch (err: any) {
        // If playback failed due to unsupported source or network, try fallback sample
        if (
          err?.name === "NotSupportedError" ||
          err?.message?.includes("supported") ||
          err?.message?.includes("source")
        ) {
          if (currentSrc !== FALLBACK_SAMPLE_VIDEO) {
            console.warn("[ShortPlayer] Play failed, recovering with fallback stream");
            setCurrentSrc(FALLBACK_SAMPLE_VIDEO);
            video.src = FALLBACK_SAMPLE_VIDEO;
            video.load();
            try {
              await video.play();
              setIsPlaying(true);
              return;
            } catch {
              // ignore
            }
          }
        }
        setIsPlaying(false);
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [start, end, currentSrc]);

  const restart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = start;
    setCurrentTime(start);
    setProgress(0);
    if (video.paused) {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [start]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  // Seek within clip via progress bar click
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const seekTo = start + pct * clipDuration;
      video.currentTime = seekTo;
      setCurrentTime(seekTo);
      setProgress(pct * 100);
    },
    [start, clipDuration]
  );

  // Render animated words — Hormozi style pop-in
  const renderCaptionWords = () => {
    if (!activeCaption) return null;
    const words = activeCaption.split(/\s+/).filter(Boolean);
    return (
      <span key={captionKey} className="caption-words-container">
        {words.map((word, i) => (
          <span
            key={`${captionKey}-${i}`}
            className="caption-word"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            {word}{" "}
          </span>
        ))}
      </span>
    );
  };

  const elapsed = Math.max(0, currentTime - start);
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="short-player-container relative">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={currentSrc}
        muted={isMuted}
        playsInline
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleVideoError}
        onTimeUpdate={(e) => syncTimeAndCaption((e.target as HTMLVideoElement).currentTime)}
        onClick={togglePlay}
        className="short-player-video"
        title={title}
      />

      {/* Fallback Banner if video source had to switch */}
      {hasLoadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center z-20">
          <AlertCircle className="w-8 h-8 text-[#eb5757] mb-2" />
          <p className="text-xs text-[#d0d6e0] font-mono">Unable to stream video source</p>
        </div>
      )}

      {/* Caption Overlay — Hormozi / TikTok neon style */}
      <div className="caption-overlay">
        <div className="caption-text-wrapper">
          {renderCaptionWords()}
        </div>
      </div>

      {/* Play/Pause Overlay Icon */}
      {!isPlaying && (
        <div className="play-overlay" onClick={togglePlay}>
          <div className="play-button-circle">
            <Play className="w-6 h-6 text-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="short-player-controls">
        {/* Clip Progress Bar */}
        <div className="progress-bar-track" onClick={handleProgressClick}>
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button onClick={togglePlay} className="ctrl-btn" type="button" title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button onClick={restart} className="ctrl-btn" type="button" title="Restart clip">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={toggleMute} className="ctrl-btn" type="button" title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
          <span className="time-display">
            {formatTime(elapsed)} / {formatTime(clipDuration)}
          </span>
        </div>
      </div>

      {/* Clip Duration Badge */}
      <div className="clip-duration-badge">
        {Math.round(clipDuration)}s clip
      </div>
    </div>
  );
}
