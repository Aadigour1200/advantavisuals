import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AVMonogram } from './AVMonogram';
import {
  BRAND_INFO,
  buildInstagramDmUrl,
  triggerInstagramDmHandoff,
} from '../config/agency';
import { trackAnalyticsEvent } from '../utils/analytics';

const START_PROJECT_DM =
  "Hi AdvantaVisuals! I'd like to start a new creative advertising project for my brand. Can we discuss details and timelines?";

const NAV_LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
];

interface NavbarProps {
  onOpenAdmin: () => void;
}

export function Navbar({ onOpenAdmin }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 h-16 transition-colors duration-200 ${
          scrolled
            ? 'bg-[#070708]/90 backdrop-blur-md border-b border-white/10'
            : 'bg-transparent border-b border-white/5'
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1360px] items-center justify-between gap-8 px-5 sm:px-8 lg:px-12">
          {/* Zone 1: Brand Wordmark (double-click opens Admin Panel) */}
          <a
            href="#top"
            onDoubleClick={(e) => {
              e.preventDefault();
              onOpenAdmin();
            }}
            className="flex items-center gap-2.5 text-white whitespace-nowrap shrink-0 select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            aria-label="AdvantaVisuals home"
          >
            <AVMonogram className="h-7 w-7 text-white" />
            <span className="text-base font-semibold tracking-tight text-white">
              {BRAND_INFO.name}
            </span>
          </a>

          {/* Zone 2: Primary Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300"
          >
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-white after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: Single Primary Action & Mobile Menu Button */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={buildInstagramDmUrl(START_PROJECT_DM)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                triggerInstagramDmHandoff('Start a Project', START_PROJECT_DM);
                trackAnalyticsEvent('instagram_click', 'Navbar Start a Project');
              }}
              className="hidden sm:inline-flex items-center justify-center bg-white px-4 py-2 text-xs font-semibold tracking-wide text-[#070708] whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Start a Project
            </a>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex md:hidden h-11 w-11 items-center justify-center border border-white/15 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="fixed inset-0 z-40 bg-[#070708] pt-24 px-6 pb-8 flex flex-col justify-between md:hidden"
        >
          <nav className="flex flex-col border-t border-white/10">
            {NAV_LINKS.map((item, idx) => (
              <a
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className="flex items-center justify-between border-b border-white/10 py-5 text-2xl font-semibold tracking-tight text-white transition-colors hover:text-zinc-300"
              >
                <span>{item.label}</span>
                <span className="text-xs font-normal text-zinc-500 tabular-nums">
                  0{idx + 1}
                </span>
              </a>
            ))}
          </nav>

          <div className="space-y-4">
            <a
              href={buildInstagramDmUrl(START_PROJECT_DM)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                triggerInstagramDmHandoff('Start a Project', START_PROJECT_DM);
                trackAnalyticsEvent('instagram_click', 'Mobile Start a Project');
                handleLinkClick();
              }}
              className="flex w-full items-center justify-center bg-white py-4 text-sm font-semibold text-[#070708] transition-colors hover:bg-zinc-200"
            >
              Start a Project
            </a>
            <a
              href={BRAND_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center border border-white/20 py-3.5 text-sm font-medium text-zinc-200 transition-colors hover:border-white hover:text-white"
            >
              Instagram {BRAND_INFO.instagramHandle}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
