import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { EditorialMarquee } from './components/EditorialMarquee';
import { PortfolioSection } from './components/PortfolioSection';
import { ServicesSection } from './components/ServicesSection';
import { WhySection } from './components/WhySection';
import { ProcessSection } from './components/ProcessSection';
import { PricingSection } from './components/PricingSection';
import { StandardPricingSection } from './components/StandardPricingSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AdminPanelModal } from './components/AdminPanelModal';
import { InstagramDmToast } from './components/InstagramDmToast';
import { PricingTier } from './config/agency';
import { StudioContentOverrides } from './types/admin';
import { trackAnalyticsEvent } from './utils/analytics';

const HERO_MARQUEE_ITEMS = [
  'AI Video Advertisements',
  'Make Your Brand Unforgettable',
  'Product Visuals',
  'Cinematic Spec Films',
  'Advertising Posters',
  'Creative Direction',
];

const STUDIO_MARQUEE_ITEMS = [
  'Discovery',
  'Creative Direction',
  'AI Production',
  'Social-Media Ready Formats',
  'Storytelling First',
  'AdvantaVisuals Studio',
];

export default function App() {
  const [selectedService, setSelectedService] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [contentOverrides, setContentOverrides] = useState<StudioContentOverrides>(
    {}
  );

  const syncChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLatestContent = () => {
      fetch('/api/content', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data && typeof data === 'object') {
            setContentOverrides(data);
          }
        })
        .catch(() => {
          // Fallback smoothly to static defaults
        });
    };

    fetchLatestContent();

    // Real-time SSE stream for instant updates across open windows and devices
    const eventSource = new EventSource('/api/content/stream');
    const handleContentEvent = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as StudioContentOverrides;
        if (!cancelled && parsed && typeof parsed === 'object') {
          setContentOverrides(parsed);
        }
      } catch {
        // Ignore malformed frame
      }
    };
    eventSource.addEventListener('content', handleContentEvent as EventListener);

    // Same-browser tab sync channel
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('advanta_content_sync');
      syncChannelRef.current = channel;
      channel.onmessage = (msg) => {
        if (!cancelled && msg.data && typeof msg.data === 'object') {
          setContentOverrides(msg.data as StudioContentOverrides);
        }
      };
    }

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchLatestContent();
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      cancelled = true;
      eventSource.removeEventListener('content', handleContentEvent as EventListener);
      eventSource.close();
      syncChannelRef.current?.close();
      syncChannelRef.current = null;
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

  const handleOverridesSaved = useCallback((next: StudioContentOverrides) => {
    setContentOverrides(next);
    try {
      syncChannelRef.current?.postMessage(next);
    } catch {
      // Ignore broadcast errors
    }
  }, []);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem('advanta_visit_logged')) {
        sessionStorage.setItem('advanta_visit_logged', '1');
        trackAnalyticsEvent('visit');
      }
    } catch {
      trackAnalyticsEvent('visit');
    }

    const sectionIds = ['work', 'services', 'pricing', 'normal-pricing', 'contact'];
    const seenSections = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          if (entry.isIntersecting && id && !seenSections.has(id)) {
            seenSections.add(id);
            trackAnalyticsEvent('section_view', id);
          }
        });
      },
      { threshold: 0.2 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleSelectService = (serviceTitle: string) => {
    trackAnalyticsEvent('package_click', serviceTitle);
    trackAnalyticsEvent('instagram_click', `Service: ${serviceTitle}`);
    setSelectedService(serviceTitle);
  };

  const handleSelectPricingTier = (tier: PricingTier) => {
    trackAnalyticsEvent('package_click', `${tier.name} (${tier.priceLabel})`);
    trackAnalyticsEvent('instagram_click', `Pricing: ${tier.name}`);
    setSelectedService(tier.defaultService);
    setSelectedBudget(tier.defaultBudget);
  };

  const handleSelectStandardPackage = (serviceTitle: string, budgetLabel: string) => {
    trackAnalyticsEvent('package_click', budgetLabel);
    trackAnalyticsEvent('instagram_click', `Rate Card: ${budgetLabel}`);
    setSelectedService(serviceTitle);
    setSelectedBudget(budgetLabel);
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F5F7]">
      <ScrollProgressBar />
      <Navbar onOpenAdmin={() => setAdminOpen(true)} />
      <main>
        <HeroSection />
        <EditorialMarquee items={HERO_MARQUEE_ITEMS} variant="dark" />
        <PortfolioSection
          filmOverrides={contentOverrides.films}
          posterOverrides={contentOverrides.posters}
          portfolioCategories={contentOverrides.portfolioCategories}
        />
        <ServicesSection onSelectService={handleSelectService} />
        <WhySection />
        <ProcessSection />
        <PricingSection
          onSelectTier={handleSelectPricingTier}
          tiers={contentOverrides.pricingTiers}
        />
        <StandardPricingSection
          onSelectPackage={handleSelectStandardPackage}
          groups={contentOverrides.standardPricingGroups}
        />
        <AboutSection />
        <EditorialMarquee items={STUDIO_MARQUEE_ITEMS} variant="light" reverse />
        <ContactSection
          preselectedService={selectedService}
          preselectedBudget={selectedBudget}
        />
      </main>
      <Footer onOpenAdmin={() => setAdminOpen(true)} />
      <AdminPanelModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        currentOverrides={contentOverrides}
        onOverridesSaved={handleOverridesSaved}
      />
      <InstagramDmToast />
    </div>
  );
}
