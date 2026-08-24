"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

export interface CaptionCue {
  start: number;
  end: number;
  text: string;
  index?: number;
}

interface ShortVideoPlayerProps {
  /** Full original video URL (signed Supabase URL) */
  sourceVideoUrl: string;
  /** Clip start time in seconds */
  startTimeSec: number;
  /** Clip end time in seconds */
  endTimeSec: number;
  /** Synchronized caption cues (timestamps relative to the ORIGINAL video) */
  captions?: CaptionCue[];
  /** Clip title for accessibility */
  title?: string;
  /** Hook caption to show at the start */
  startCaption?: string;
  /** CTA caption to show at the end */
  endCaption?: string;
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
  startTimeSec,
  endTimeSec,
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
  const animFrameRef = useRef<number>(0);
  const lastCaptionRef = useRef<string>("");

  const clipDuration = endTimeSec - startTimeSec;

  // Seek to start time when video loads
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = startTimeSec;
    }
  }, [startTimeSec]);

  // Animation frame loop: enforce trim bounds + sync captions
  const tick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const t = video.currentTime;

    // Enforce end bound — loop back to start
    if (t >= endTimeSec - 0.05) {
      video.currentTime = startTimeSec;
      setCurrentTime(startTimeSec);
      setProgress(0);
      animFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    // Enforce start bound
    if (t < startTimeSec - 0.1) {
      video.currentTime = startTimeSec;
    }

    setCurrentTime(t);
    setProgress(((t - startTimeSec) / clipDuration) * 100);

    // Find active caption cue for current time
    const activeCue = captions.find((c) => t >= c.start - 0.05 && t <= c.end + 0.05);

    // Check for hook/CTA captions at boundaries
    let captionText = "";
    if (activeCue) {
      captionText = activeCue.text;
    } else if (startCaption && t < startTimeSec + 3) {
      captionText = startCaption;
    } else if (endCaption && t > endTimeSec - 3) {
      captionText = endCaption;
    }

    if (captionText !== lastCaptionRef.current) {
      lastCaptionRef.current = captionText;
      setActiveCaption(captionText);
      setCaptionKey((k) => k + 1);
    }

    animFrameRef.current = requestAnimationFrame(tick);
  }, [startTimeSec, endTimeSec, clipDuration, captions, startCaption, endCaption]);

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
      if (video.currentTime < startTimeSec || video.currentTime >= endTimeSec) {
        video.currentTime = startTimeSec;
      }
      await video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [startTimeSec, endTimeSec]);

  const restart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = startTimeSec;
    setCurrentTime(startTimeSec);
    setProgress(0);
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    }
  }, [startTimeSec]);

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
      const seekTo = startTimeSec + pct * clipDuration;
      video.currentTime = seekTo;
      setCurrentTime(seekTo);
      setProgress(pct * 100);
    },
    [startTimeSec, clipDuration]
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

  const elapsed = currentTime - startTimeSec;
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="short-player-container">
      {/* Video Element — hidden native controls */}
      <video
        ref={videoRef}
        src={sourceVideoUrl}
        muted={isMuted}
        playsInline
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        className="short-player-video"
        title={title}
      />

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
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button onClick={togglePlay} className="ctrl-btn" title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button onClick={restart} className="ctrl-btn" title="Restart clip">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={toggleMute} className="ctrl-btn" title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
          <span className="time-display">
            {formatTime(Math.max(0, elapsed))} / {formatTime(clipDuration)}
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
