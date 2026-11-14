import { PointerEvent, useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { ArrowUpRight, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { PortfolioVisualItem } from '../config/portfolio';
import {
  buildInstagramDmUrl,
  triggerInstagramDmHandoff,
} from '../config/agency';
import { trackAnalyticsEvent } from '../utils/analytics';

interface VisualShowcaseCardProps {
  item: PortfolioVisualItem;
  onOpenLightbox: (item: PortfolioVisualItem) => void;
}

export function VisualShowcaseCard({
  item,
  onOpenLightbox,
}: VisualShowcaseCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [item.imageSrc]);

  // Subtle magnetic springs matching VideoShowcaseCard
  const rawCardX = useMotionValue(0);
  const rawCardY = useMotionValue(0);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const rawGlowOpacity = useMotionValue(0);

  const springConfig = { stiffness: 220, damping: 24, mass: 0.6 };
  const cardX = useSpring(rawCardX, springConfig);
  const cardY = useSpring(rawCardY, springConfig);
  const glowOpacity = useSpring(rawGlowOpacity, { stiffness: 200, damping: 26 });
  const spotlightBg = useMotionTemplate`radial-gradient(360px circle at ${glowX}% ${glowY}%, rgba(255, 255, 255, 0.08), transparent 65%)`;

  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    if (prefersReducedMotion || e.pointerType !== 'mouse' || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    rawCardX.set((relX - 0.5) * 9);
    rawCardY.set((relY - 0.5) * 9);
    glowX.set(relX * 100);
    glowY.set(relY * 100);
    rawGlowOpacity.set(1);
  };

  const handlePointerLeave = () => {
    rawCardX.set(0);
    rawCardY.set(0);
    rawGlowOpacity.set(0);
  };

  const frameClass =
    item.aspectRatio === '3:4'
      ? 'aspect-[3/4] w-full max-w-[280px] sm:max-w-[300px]'
      : item.aspectRatio === '1:1'
        ? 'aspect-square w-full max-w-[320px]'
        : 'aspect-[4/3] w-full';

  const dmMessage = `Hi AdvantaVisuals! I loved the "${item.title}" (${item.visualType}) in your portfolio and would like to create similar visuals for my brand.`;

  return (
    <motion.article
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={prefersReducedMotion ? undefined : { x: cardX, y: cardY }}
      className="group relative flex flex-col border border-white/12 bg-[#0D0D10] transition-colors duration-200 hover:border-white/30 will-change-transform"
    >
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          style={{ background: spotlightBg, opacity: glowOpacity }}
          className="pointer-events-none absolute inset-0 z-10"
        />
      )}

      {/* Visual Frame */}
      <div className="relative w-full bg-[#09090B] border-b border-white/10 overflow-hidden flex items-center justify-center p-4 sm:p-6 min-h-[290px] sm:min-h-[340px]">
        <button
          type="button"
          onClick={() => onOpenLightbox(item)}
          aria-label={`Inspect full resolution view of ${item.title}`}
          className={`relative overflow-hidden bg-black border border-white/10 text-left focus-visible:outline-2 focus-visible:outline-white ${frameClass}`}
        >
          {!imageError && item.imageSrc ? (
            <img
              src={item.imageSrc}
              alt={item.imageAlt || item.title}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950 p-6 text-center">
              <ImageIcon className="h-7 w-7 text-zinc-500" aria-hidden="true" />
              <p className="mt-2 text-xs font-medium text-zinc-300">{item.title}</p>
            </div>
          )}

          {/* Subtle Gradient Contrast Scrim */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/25"
            aria-hidden="true"
          />

          {/* Top Metadata */}
          <div className="absolute top-3 left-3.5 right-3.5 flex items-center justify-between gap-2 text-[11px] tracking-wide text-zinc-200">
            <span className="tabular-nums font-medium text-white/95">
              {item.aspectRatio}
            </span>
            <span className="text-zinc-300/90">{item.visualType}</span>
          </div>

          {/* Center Inspect Icon on Hover */}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="flex h-11 w-11 items-center justify-center border border-white/35 bg-black/70 text-white backdrop-blur-sm">
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </span>
          </span>
        </button>
      </div>

      {/* Editorial Footer Metadata */}
      <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-xs text-zinc-400">
            <span>
              <span className="tabular-nums text-zinc-500">{item.indexNumber}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>{item.category}</span>
            </span>
            <span className="text-zinc-500">High-Res Study</span>
          </div>

          <h4 className="text-xl font-semibold tracking-tight text-white">
            {item.title}
          </h4>

          <p className="text-sm leading-relaxed text-zinc-400">
            {item.conceptNote}
          </p>
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onOpenLightbox(item)}
            className="text-xs font-medium text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-white"
          >
            Inspect Full Resolution
          </button>

          <a
            href={buildInstagramDmUrl(dmMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              triggerInstagramDmHandoff(item.title, dmMessage);
              trackAnalyticsEvent('instagram_click', `Visual: ${item.title}`);
            }}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white"
          >
            <span>Order Similar</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </motion.article>
  );
}
