import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import heroStudioImage from '../assets/images/hero_cinematic_studio_1794666377762.jpg';
import { buildInstagramDmUrl, triggerInstagramDmHandoff } from '../config/agency';
import { trackAnalyticsEvent } from '../utils/analytics';

const HERO_START_PROJECT_DM =
  'Hi AdvantaVisuals! I just viewed your work and want to start a new creative campaign project for my brand.';

export function HeroSection() {
  const [imageError, setImageError] = useState(false);

  return (
    <section
      id="top"
      className="relative bg-[#070708] text-white pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 border-b border-white/10"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        {/* Two-column editorial split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Typographic Column */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-between space-y-8"
          >
            <div className="space-y-6">
              <p className="text-xs sm:text-sm tracking-[0.18em] text-zinc-400 uppercase">
                AI Advertising Studio · Spec &amp; Campaign Production
              </p>

              <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.98] font-extrabold tracking-tight text-white text-balance">
                MAKE YOUR BRAND{' '}
                <span className="font-editorial italic font-medium tracking-normal text-zinc-200 block sm:inline">
                  UNFORGETTABLE.
                </span>
              </h1>

              <p className="max-w-xl text-base sm:text-lg leading-relaxed text-zinc-300">
                Cinematic AI-powered advertising for brands that want to stand out.
              </p>
            </div>

            {/* Action Hierarchy: One Dominant Primary + Understated Secondary */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#work"
                className="inline-flex items-center gap-2.5 bg-white px-6 py-3.5 text-sm font-semibold text-[#070708] whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>Explore Our Work</span>
                <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
              </a>

              <a
                href={buildInstagramDmUrl(HERO_START_PROJECT_DM)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  triggerInstagramDmHandoff('Start a Project', HERO_START_PROJECT_DM);
                  trackAnalyticsEvent('instagram_click', 'Hero Start a Project');
                }}
                className="inline-flex items-center gap-2 border border-white/25 px-6 py-3.5 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-white hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>Start a Project</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </motion.div>

          {/* Right Cinematic Visual Frame */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative overflow-hidden border border-white/12 bg-[#101012] min-h-[280px] sm:min-h-[380px] lg:min-h-[440px]"
          >
            {!imageError ? (
              <img
                src={heroStudioImage}
                alt="Anamorphic cinema lens and sculpted obsidian forms inside a minimalist monochrome studio"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="h-full w-full object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-[#0c0c0e] to-black p-8 text-center">
                <span className="font-editorial italic text-2xl text-zinc-300">
                  AdvantaVisuals
                </span>
                <span className="mt-2 text-xs text-zinc-500">
                  Cinematic AI Advertising Studio
                </span>
              </div>
            )}

            {/* Measured bottom contrast scrim */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
              aria-hidden="true"
            />

            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-xs text-zinc-300">
              <span className="font-editorial italic text-base text-white">
                Direction · Storytelling · AI Production
              </span>
              <span className="hidden sm:inline text-zinc-400 tabular-nums">
                16:9 &amp; 9:16 Formats
              </span>
            </div>
          </motion.div>
        </div>

        {/* Full-width quiet capability strip below split */}
        <div className="mt-12 lg:mt-16 pt-8 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-zinc-500 text-xs">Discipline</p>
            <p className="mt-1 font-medium text-zinc-100">AI Video Commercials</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs">Visual Craft</p>
            <p className="mt-1 font-medium text-zinc-100">Product &amp; Poster Imagery</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs">Delivery Ratios</p>
            <p className="mt-1 font-medium text-zinc-100 tabular-nums">9:16 Reels &amp; 16:9 Cinema</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs">Studio Model</p>
            <p className="mt-1 font-medium text-zinc-100">Monthly &amp; Custom Projects</p>
          </div>
        </div>
      </div>
    </section>
  );
}
