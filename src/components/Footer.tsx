import { ArrowUpRight } from 'lucide-react';
import { AVMonogram } from './AVMonogram';
import { BRAND_INFO } from '../config/agency';
import { trackAnalyticsEvent } from '../utils/analytics';

const FOOTER_LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

interface FooterProps {
  onOpenAdmin: () => void;
}

export function Footer({ onOpenAdmin }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#050506] text-zinc-400 py-14 sm:py-16">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 space-y-10">
        {/* Top Row: Brand, Navigation, Instagram */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-white/10">
          <div
            onDoubleClick={onOpenAdmin}
            className="flex items-center gap-3 select-none cursor-pointer"
          >
            <AVMonogram className="h-8 w-8 text-white" />
            <div>
              <p className="text-base font-semibold tracking-tight text-white">
                {BRAND_INFO.name}
              </p>
              <p className="text-xs text-zinc-500">{BRAND_INFO.tagline}</p>
            </div>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-zinc-300"
          >
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="whitespace-nowrap transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href={BRAND_INFO.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAnalyticsEvent('instagram_click', 'Footer Link')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white underline underline-offset-4 hover:text-zinc-300 whitespace-nowrap self-start lg:self-auto"
          >
            <span>Instagram ({BRAND_INFO.instagramHandle})</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        {/* Bottom Row: Copyright & Independent Spec Work Disclaimer */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 text-xs leading-relaxed text-zinc-500">
          <p className="max-w-3xl">{BRAND_INFO.disclaimerCopy}</p>
          <p className="whitespace-nowrap shrink-0 text-zinc-400">
            © {year} {BRAND_INFO.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
