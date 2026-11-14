import { ChangeEvent, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Film, Upload, X } from 'lucide-react';
import {
  PORTFOLIO_FILMS,
  PORTFOLIO_VISUALS,
  PortfolioFilm,
  PortfolioVisualItem,
  VideoAspectRatio,
  VisualType,
} from '../config/portfolio';
import {
  buildInstagramDmUrl,
  triggerInstagramDmHandoff,
} from '../config/agency';
import { VideoShowcaseCard } from './VideoShowcaseCard';
import { VisualShowcaseCard } from './VisualShowcaseCard';
import { FilmOverride } from '../types/admin';
import { trackAnalyticsEvent } from '../utils/analytics';

type PortfolioTab = 'all' | 'films' | 'visuals';
type RatioFilter = 'all' | VideoAspectRatio;
type VisualFilter = 'all' | VisualType;

interface PortfolioSectionProps {
  filmOverrides?: Record<string, FilmOverride>;
  posterOverrides?: PortfolioVisualItem[];
  portfolioCategories?: string[];
}

export function PortfolioSection({
  filmOverrides,
  posterOverrides,
  portfolioCategories,
}: PortfolioSectionProps) {
  const [activeTab, setActiveTab] = useState<PortfolioTab>('all');
  const [ratioFilter, setRatioFilter] = useState<RatioFilter>('all');
  const [visualFilter, setVisualFilter] = useState<VisualFilter>('all');
  const [visualCategoryFilter, setVisualCategoryFilter] = useState<string>('all');
  const [activeFilm, setActiveFilm] = useState<PortfolioFilm | null>(null);
  const [activeVisual, setActiveVisual] = useState<PortfolioVisualItem | null>(null);
  const [localVideos, setLocalVideos] = useState<Record<string, string>>({});

  const mergedFilms: PortfolioFilm[] = PORTFOLIO_FILMS.map((film) => {
    const ov = filmOverrides?.[film.id];
    if (!ov) return film;
    return {
      ...film,
      title: ov.title || film.title,
      category: ov.category || film.category,
      aspectRatio: ov.aspectRatio || film.aspectRatio,
      duration: ov.duration || film.duration,
      videoSrc: ov.videoSrc !== undefined ? ov.videoSrc : film.videoSrc,
      conceptNote: ov.conceptNote || film.conceptNote,
    };
  });

  const activeVisuals = Array.isArray(posterOverrides)
    ? posterOverrides
    : PORTFOLIO_VISUALS;

  const hasVisuals = activeVisuals.length > 0;

  // Categories actively mapped to posters & product visuals (ordered cleanly using studio categories first)
  const activeVisualCategories = (() => {
    const used = new Set(
      activeVisuals.map((item) => item.category.trim()).filter(Boolean)
    );
    const ordered: string[] = [];
    (portfolioCategories || []).forEach((cat) => {
      if (used.has(cat) && !ordered.includes(cat)) ordered.push(cat);
    });
    used.forEach((cat) => {
      if (!ordered.includes(cat)) ordered.push(cat);
    });
    return ordered;
  })();

  const effectiveVisualCategory =
    visualCategoryFilter === 'all' || activeVisualCategories.includes(visualCategoryFilter)
      ? visualCategoryFilter
      : 'all';

  const filteredFilms =
    ratioFilter === 'all'
      ? mergedFilms
      : mergedFilms.filter((film) => film.aspectRatio === ratioFilter);

  const filteredVisuals = activeVisuals.filter((item) => {
    const matchesType = visualFilter === 'all' || item.visualType === visualFilter;
    const matchesCategory =
      effectiveVisualCategory === 'all' || item.category === effectiveVisualCategory;
    return matchesType && matchesCategory;
  });

  const handleAttachLocalVideo = (id: string, objectUrl: string) => {
    setLocalVideos((prev) => ({
      ...prev,
      [id]: objectUrl,
    }));
  };

  useEffect(() => {
    if (!activeFilm && !activeVisual) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveFilm(null);
        setActiveVisual(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeFilm, activeVisual]);

  const activeModalVideoSrc = activeFilm
    ? localVideos[activeFilm.id] || activeFilm.videoSrc
    : '';

  const handleModalFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeFilm) return;
    const url = URL.createObjectURL(file);
    handleAttachLocalVideo(activeFilm.id, url);
  };

  const effectiveTab: PortfolioTab =
    !hasVisuals && activeTab === 'visuals' ? 'all' : activeTab;
  const showFilms = effectiveTab === 'all' || effectiveTab === 'films';
  const showVisuals = hasVisuals && (effectiveTab === 'all' || effectiveTab === 'visuals');

  return (
    <section
      id="work"
      className="bg-[#070708] text-white py-20 sm:py-28 border-b border-white/10"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-white/10">
          <div className="space-y-4 max-w-2xl">
            <p className="text-xs tracking-[0.18em] text-zinc-400 uppercase">
              {hasVisuals
                ? 'Selected Works · Films, Posters & Visuals'
                : 'Selected Works · Spec & Concept Films'}
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white text-balance">
              Spec &amp; Concept{' '}
              <span className="font-editorial italic font-normal text-zinc-300">
                Creative Portfolio
              </span>
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-400">
              {hasVisuals
                ? 'Independent concept films, brand posters, and AI product photography produced to demonstrate creative direction, lighting craft, and visual storytelling.'
                : 'Independent concept films produced to demonstrate creative direction, lighting craft, and visual storytelling.'}
            </p>
          </div>

          {/* Primary Portfolio View Switcher */}
          {hasVisuals && (
            <div
              role="group"
              aria-label="Filter portfolio by category"
              className="inline-flex flex-wrap items-center gap-1 border border-white/15 bg-[#0E0E11] p-1 self-start lg:self-auto"
            >
              {(
                [
                  { value: 'all', label: `All Work (${mergedFilms.length + activeVisuals.length})` },
                  { value: 'films', label: `Spec Films (${mergedFilms.length})` },
                  { value: 'visuals', label: `Posters & Visuals (${activeVisuals.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-white ${
                    effectiveTab === tab.value
                      ? 'bg-white text-[#070708]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PART 1: SPEC & CONCEPT FILMS */}
        {showFilms && (
          <div className="mt-12 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.16em] text-zinc-500 uppercase">
                  01 · Motion &amp; Video Ads
                </p>
                <h3 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Spec &amp; Concept Films
                </h3>
              </div>

              <div
                role="group"
                aria-label="Filter portfolio films by aspect ratio"
                className="inline-flex items-center gap-1 border border-white/12 bg-[#0B0B0E] p-1 self-start sm:self-auto"
              >
                {(
                  [
                    { value: 'all', label: 'All Ratios' },
                    { value: '16:9', label: '16:9 Cinema' },
                    { value: '9:16', label: '9:16 Vertical' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setRatioFilter(tab.value)}
                    className={`px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-white ${
                      ratioFilter === tab.value
                        ? 'bg-white text-[#070708]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {filteredFilms.map((film) => (
                <VideoShowcaseCard
                  key={film.id}
                  film={film}
                  localPreviewUrl={localVideos[film.id]}
                  onAttachLocalVideo={handleAttachLocalVideo}
                  onOpenLightbox={setActiveFilm}
                />
              ))}
            </motion.div>
          </div>
        )}

        {/* PART 2: POSTERS & PRODUCT VISUALS */}
        {showVisuals && (
          <div
            id="posters-gallery"
            className={`${showFilms ? 'mt-20 pt-16 border-t border-white/10' : 'mt-12'} space-y-8`}
          >
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.16em] text-zinc-500 uppercase">
                    02 · Key Visuals &amp; Photography
                  </p>
                  <h3 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Brand Posters &amp;{' '}
                    <span className="font-editorial italic font-normal text-zinc-300">
                      Product Visuals
                    </span>
                  </h3>
                </div>

                <div
                  role="group"
                  aria-label="Filter posters and product visuals"
                  className="inline-flex items-center gap-1 border border-white/12 bg-[#0B0B0E] p-1 self-start sm:self-auto"
                >
                  {(
                    [
                      { value: 'all', label: 'All Visuals' },
                      { value: 'Brand Poster', label: 'Brand Posters' },
                      { value: 'Product Visual', label: 'Product Visuals' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setVisualFilter(tab.value)}
                      className={`px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-white ${
                        visualFilter === tab.value
                          ? 'bg-white text-[#070708]'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeVisualCategories.length > 1 && (
                <div
                  role="group"
                  aria-label="Filter visuals by portfolio category"
                  className="flex flex-wrap items-center gap-1.5"
                >
                  <button
                    type="button"
                    onClick={() => setVisualCategoryFilter('all')}
                    className={`px-3 py-1 text-[11px] border transition-colors ${
                      effectiveVisualCategory === 'all'
                        ? 'border-white bg-white/10 text-white font-medium'
                        : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    All Categories
                  </button>
                  {activeVisualCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setVisualCategoryFilter(cat)}
                      className={`px-3 py-1 text-[11px] border transition-colors ${
                        effectiveVisualCategory === cat
                          ? 'border-white bg-white/10 text-white font-medium'
                          : 'border-white/10 text-zinc-400 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredVisuals.length === 0 ? (
              <div className="border border-white/10 bg-[#0B0B0E] p-10 text-center space-y-3">
                <p className="text-sm text-zinc-300">
                  No posters or product visuals match this category filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setVisualFilter('all');
                    setVisualCategoryFilter('all');
                  }}
                  className="inline-flex items-center border border-white/25 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white hover:text-[#070708]"
                >
                  Show All Visuals
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {filteredVisuals.map((item) => (
                  <VisualShowcaseCard
                    key={item.id}
                    item={item}
                    onOpenLightbox={setActiveVisual}
                  />
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Quiet Spec Work Disclaimer Strip */}
        <div className="mt-12 pt-6 border-t border-white/10 text-xs text-zinc-400">
          <p>
            Disclaimer: All featured brand films and concept visuals are independent spec studies created by AdvantaVisuals and are not official campaigns or endorsements by Porsche, Rolex, Kimirica, or Roadster.
          </p>
        </div>
      </div>

      {/* Film Theater Lightbox Modal */}
      {activeFilm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${activeFilm.title} preview modal`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-sm"
          onClick={() => setActiveFilm(null)}
        >
          <div
            className="relative w-full max-w-4xl border border-white/15 bg-[#0B0B0D] p-5 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs text-zinc-400">
                  {activeFilm.indexNumber} · {activeFilm.category} · {activeFilm.aspectRatio}
                </p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight text-white">
                  {activeFilm.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveFilm(null)}
                aria-label="Close theater view"
                className="inline-flex h-10 w-10 items-center justify-center border border-white/20 text-white transition-colors hover:bg-white hover:text-[#070708] focus-visible:outline-2 focus-visible:outline-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex justify-center bg-black border border-white/10 p-4">
              {activeModalVideoSrc ? (
                <video
                  src={activeModalVideoSrc}
                  controls
                  autoPlay
                  playsInline
                  className={
                    activeFilm.aspectRatio === '9:16'
                      ? 'aspect-[9/16] max-h-[60vh] w-auto object-cover'
                      : 'aspect-video w-full max-h-[60vh] object-cover'
                  }
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center max-w-md space-y-4">
                  <div className="h-14 w-14 flex items-center justify-center border border-white/20 text-zinc-300">
                    <Film className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-white">
                      {activeFilm.title} — Concept Reel
                    </p>
                    <p className="text-sm leading-relaxed text-zinc-400">
                      This concept film preview is not uploaded yet. You can preview a video file directly from your device or reach out to @advantavisuals to request the full cut.
                    </p>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 bg-white px-5 py-2.5 text-xs font-semibold text-[#070708] transition-colors hover:bg-zinc-200">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    <span>Preview Video File</span>
                    <input
                      type="file"
                      accept="video/mp4,video/*"
                      onChange={handleModalFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
              <p>{activeFilm.conceptNote}</p>
              <span className="text-zinc-500 whitespace-nowrap shrink-0">
                {activeFilm.specLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Poster & Product Visual Lightbox Modal */}
      {activeVisual && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${activeVisual.title} full resolution preview`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-sm"
          onClick={() => setActiveVisual(null)}
        >
          <div
            className="relative w-full max-w-4xl border border-white/15 bg-[#0B0B0D] p-5 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs text-zinc-400">
                  {activeVisual.indexNumber} · {activeVisual.visualType} · {activeVisual.category} ·{' '}
                  {activeVisual.aspectRatio}
                </p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight text-white">
                  {activeVisual.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveVisual(null)}
                aria-label="Close visual preview"
                className="inline-flex h-10 w-10 items-center justify-center border border-white/20 text-white transition-colors hover:bg-white hover:text-[#070708] focus-visible:outline-2 focus-visible:outline-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex justify-center bg-black border border-white/10 p-4">
              <img
                src={activeVisual.imageSrc}
                alt={activeVisual.imageAlt || activeVisual.title}
                referrerPolicy="no-referrer"
                className="max-h-[64vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-zinc-400">
              <p className="max-w-xl leading-relaxed">{activeVisual.conceptNote}</p>
              {(() => {
                const dmMessage = `Hi AdvantaVisuals! I loved the "${activeVisual.title}" (${activeVisual.visualType}) in your portfolio and would like to commission similar visuals for my brand.`;
                return (
                  <a
                    href={buildInstagramDmUrl(dmMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      triggerInstagramDmHandoff(activeVisual.title, dmMessage);
                      trackAnalyticsEvent('instagram_click', `Visual Modal: ${activeVisual.title}`);
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-white px-5 py-2.5 text-xs font-semibold text-[#070708] whitespace-nowrap shrink-0 transition-colors hover:bg-zinc-200"
                  >
                    <span>Order Similar on Instagram</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
