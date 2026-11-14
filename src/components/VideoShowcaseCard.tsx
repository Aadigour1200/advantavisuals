import { ChangeEvent, PointerEvent, useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import {
  Film,
  Maximize2,
  Pause,
  Play,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PortfolioFilm } from '../config/portfolio';
import { trackAnalyticsEvent } from '../utils/analytics';

interface VideoShowcaseCardProps {
  film: PortfolioFilm;
  localPreviewUrl?: string;
  onAttachLocalVideo: (id: string, objectUrl: string) => void;
  onOpenLightbox: (film: PortfolioFilm) => void;
}

export function VideoShowcaseCard({
  film,
  localPreviewUrl,
  onAttachLocalVideo,
  onOpenLightbox,
}: VideoShowcaseCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [videoLoadFailed, setVideoLoadFailed] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  // Subtle magnetic springs for card & play affordance
  const rawCardX = useMotionValue(0);
  const rawCardY = useMotionValue(0);
  const rawBtnX = useMotionValue(0);
  const rawBtnY = useMotionValue(0);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const rawGlowOpacity = useMotionValue(0);

  const springConfig = { stiffness: 220, damping: 24, mass: 0.6 };
  const cardX = useSpring(rawCardX, springConfig);
  const cardY = useSpring(rawCardY, springConfig);
  const btnX = useSpring(rawBtnX, { stiffness: 260, damping: 20, mass: 0.45 });
  const btnY = useSpring(rawBtnY, { stiffness: 260, damping: 20, mass: 0.45 });
  const glowOpacity = useSpring(rawGlowOpacity, { stiffness: 200, damping: 26 });

  const spotlightBg = useMotionTemplate`radial-gradient(380px circle at ${glowX}% ${glowY}%, rgba(255, 255, 255, 0.08), transparent 65%)`;

  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    if (prefersReducedMotion || e.pointerType !== 'mouse' || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width; // 0..1
    const relY = (e.clientY - rect.top) / rect.height; // 0..1
    const offsetX = relX - 0.5; // -0.5..0.5
    const offsetY = relY - 0.5; // -0.5..0.5

    rawCardX.set(offsetX * 10); // max ±5px
    rawCardY.set(offsetY * 10); // max ±5px
    rawBtnX.set(offsetX * 18); // max ±9px
    rawBtnY.set(offsetY * 18); // max ±9px
    glowX.set(relX * 100);
    glowY.set(relY * 100);
    rawGlowOpacity.set(1);
  };

  const handlePointerLeave = () => {
    rawCardX.set(0);
    rawCardY.set(0);
    rawBtnX.set(0);
    rawBtnY.set(0);
    rawGlowOpacity.set(0);
  };

  const activeVideoSrc = localPreviewUrl || film.videoSrc;
  const hasVideoSource = Boolean(activeVideoSrc) && !videoLoadFailed;

  useEffect(() => {
    setVideoLoadFailed(false);
    setIsPlaying(false);
    setProgress(0);
  }, [activeVideoSrc]);

  const togglePlay = async () => {
    const videoEl = videoRef.current;
    if (!videoEl || !hasVideoSource) return;

    if (videoEl.paused) {
      try {
        await videoEl.play();
        setIsPlaying(true);
        trackAnalyticsEvent('film_play', film.title);
      } catch {
        setIsPlaying(false);
      }
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.muted = !videoEl.muted;
    setIsMuted(videoEl.muted);
  };

  const handleTimeUpdate = () => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoEl.duration) return;
    setProgress((videoEl.currentTime / videoEl.duration) * 100);
  };

  const handleScrub = (e: ChangeEvent<HTMLInputElement>) => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoEl.duration) return;
    const pct = Number(e.target.value);
    videoEl.currentTime = (pct / 100) * videoEl.duration;
    setProgress(pct);
  };

  const handleLocalFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onAttachLocalVideo(film.id, url);
    setVideoLoadFailed(false);
  };

  const isVertical = film.aspectRatio === '9:16';

  return (
    <motion.article
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={prefersReducedMotion ? undefined : { x: cardX, y: cardY }}
      className="group relative flex flex-col border border-white/12 bg-[#0D0D10] transition-colors duration-200 hover:border-white/30 will-change-transform"
    >
      {/* Subtle Cursor-Tracking Silver Sheen */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{ background: spotlightBg, opacity: glowOpacity }}
          className="pointer-events-none absolute inset-0 z-10"
        />
      )}
      {/* Media Frame */}
      <div className="relative w-full bg-[#09090B] border-b border-white/10 overflow-hidden flex items-center justify-center p-4 sm:p-6">
        <div
          className={`relative overflow-hidden bg-black border border-white/10 ${
            isVertical
              ? 'aspect-[9/16] w-full max-w-[270px] sm:max-w-[290px]'
              : 'aspect-video w-full'
          }`}
        >
          {/* Poster Thumbnail (only shown when no MP4 video is uploaded/attached) */}
          {!hasVideoSource &&
            (!thumbFailed ? (
              <img
                src={film.thumbnailSrc}
                alt={film.thumbnailAlt}
                referrerPolicy="no-referrer"
                onError={() => setThumbFailed(true)}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950 p-6 text-center">
                <Film className="h-7 w-7 text-zinc-500" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-zinc-200">{film.title}</p>
              </div>
            ))}

          {/* Actual MP4 Video Element (serves as its own cover frame when uploaded) */}
          {hasVideoSource && (
            <video
              ref={videoRef}
              src={activeVideoSrc}
              muted={isMuted}
              playsInline
              loop
              preload="auto"
              onLoadedMetadata={() => {
                const videoEl = videoRef.current;
                if (
                  videoEl &&
                  videoEl.paused &&
                  videoEl.currentTime === 0 &&
                  Number.isFinite(videoEl.duration) &&
                  videoEl.duration > 0.2
                ) {
                  videoEl.currentTime = 0.05;
                }
              }}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => setVideoLoadFailed(true)}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
          )}

          {/* Contrast Scrim */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/25"
            aria-hidden="true"
          />

          {/* Top-left Format & Concept Indicator (unboxed typographic metadata) */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 text-[11px] tracking-wide text-zinc-300">
            <span className="tabular-nums font-medium text-white/90">
              {film.aspectRatio} · {film.duration}
            </span>
            <span className="text-zinc-300/90">Spec Ad</span>
          </div>

          {/* Center Action Overlay */}
          {hasVideoSource ? (
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? `Pause ${film.title}` : `Play ${film.title}`}
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-white ${
                isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
              }`}
            >
              <motion.span
                style={prefersReducedMotion ? undefined : { x: btnX, y: btnY }}
                className="flex h-14 w-14 items-center justify-center border border-white/35 bg-black/65 text-white backdrop-blur-sm transition-transform duration-150 group-hover:scale-105"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Play className="h-5 w-5 translate-x-0.5" aria-hidden="true" />
                )}
              </motion.span>
            </button>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center">
              <motion.button
                type="button"
                onClick={() => {
                  trackAnalyticsEvent('film_play', film.title);
                  onOpenLightbox(film);
                }}
                style={prefersReducedMotion ? undefined : { x: btnX, y: btnY }}
                aria-label={`Open ${film.title} studio preview`}
                className="flex h-12 w-12 items-center justify-center border border-white/30 bg-black/70 text-white backdrop-blur-sm transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-white"
              >
                <Play className="h-4 w-4 translate-x-0.5" aria-hidden="true" />
              </motion.button>
              <p className="mt-3 text-xs font-medium text-white">
                Studio Reel Ready
              </p>
              <p className="mt-1 max-w-[230px] text-[11px] leading-relaxed text-zinc-300">
                Concept showcase reel slot ready for playback or local video preview.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-1.5 border border-white/30 bg-black/75 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-white hover:text-[#070708] focus-visible:outline-2 focus-visible:outline-white"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Preview Video</span>
              </button>
            </div>
          )}

          {/* Bottom Video Controls Bar (when MP4 is active) */}
          {hasVideoSource && (
            <div className="absolute bottom-0 inset-x-0 flex items-center gap-2.5 bg-black/75 px-3 py-2.5 backdrop-blur-sm">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? `Pause ${film.title}` : `Play ${film.title}`}
                className="text-white hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-white"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>

              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={handleScrub}
                aria-label={`Seek ${film.title}`}
                className="h-1 flex-1 cursor-pointer accent-white bg-white/25"
              />

              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? `Unmute ${film.title}` : `Mute ${film.title}`}
                className="text-white hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-white"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onOpenLightbox(film)}
                aria-label={`Expand ${film.title} in theater view`}
                className="text-white hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-white"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/*"
          onChange={handleLocalFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Editorial Card Metadata & Actions */}
      <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-xs text-zinc-400">
            <span>
              <span className="tabular-nums text-zinc-500">{film.indexNumber}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>{film.category}</span>
            </span>
            <span className="text-zinc-500">Independent Concept Ad</span>
          </div>

          <h3 className="text-xl font-semibold tracking-tight text-white">
            {film.title}
          </h3>

          <p className="text-sm leading-relaxed text-zinc-400">
            {film.conceptNote}
          </p>
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onOpenLightbox(film)}
            className="text-xs font-medium text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-white"
          >
            {hasVideoSource ? 'Open Theater View' : 'View Details'}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-zinc-400 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white"
          >
            {localPreviewUrl ? 'Replace Video' : 'Preview Video'}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
