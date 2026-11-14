export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  summary: string;
  deliverableFocus: string;
  featured?: boolean;
}

export interface WhyPillar {
  number: string;
  title: string;
  description: string;
}

export interface ProcessStep {
  step: string;
  title: string;
  description: string;
}

export interface PricingTier {
  id: string;
  name: string;
  priceLabel: string;
  cadenceLabel: string;
  features: string[];
  highlighted?: boolean;
  defaultService: string;
  defaultBudget: string;
  customDmMessage?: string;
}

export const BRAND_INFO = {
  name: 'AdvantaVisuals',
  tagline: 'Make Your Brand Unforgettable.',
  instagramHandle: '@advantavisuals',
  instagramUrl: 'https://www.instagram.com/advantavisuals/',
  instagramDmBaseUrl: 'https://ig.me/m/advantavisuals',
  aboutCopy:
    'AdvantaVisuals is an independent AI-powered creative advertising studio focused on transforming ideas into visually compelling advertisements. We combine creative direction, storytelling and modern AI technology to help brands communicate their products in a memorable way.',
  disclaimerCopy:
    'All featured brand films (Porsche, Rolex, Kimirica, and Roadster) are independent concept and spec advertisements created solely to demonstrate creative direction and AI production capabilities. They are not official brand campaigns, commissions, or endorsements.',
};

export function buildInstagramDmUrl(message: string): string {
  return `${BRAND_INFO.instagramDmBaseUrl}?text=${encodeURIComponent(message)}`;
}

export function copyTextReliably(text: string): boolean {
  let copied = false;
  try {
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      copied = document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  } catch {
    copied = false;
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).catch(() => {});
    }
  } catch {
    // Ignore async clipboard errors
  }

  return copied;
}

export function copyDmMessageSilently(message: string): void {
  copyTextReliably(message);
}

export interface DmHandoffDetail {
  label: string;
  message: string;
  url: string;
}

export function triggerInstagramDmHandoff(label: string, message: string): void {
  copyTextReliably(message);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<DmHandoffDetail>('advanta:dm-handoff', {
        detail: {
          label,
          message,
          url: buildInstagramDmUrl(message),
        },
      })
    );
  }
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'ai-video-ads',
    number: '01',
    title: 'AI Video Advertisements',
    summary: 'Cinematic short-form ads.',
    deliverableFocus: 'Concept scripting, visual pacing, and polished 16:9 or 9:16 commercial cuts built for attention.',
    featured: true,
  },
  {
    id: 'ugc-style-ads',
    number: '02',
    title: 'UGC-Style Advertisements',
    summary: 'Natural product-focused creative.',
    deliverableFocus: 'Authentic, native-feeling social storytelling designed to blend seamlessly into modern feeds.',
  },
  {
    id: 'product-visuals',
    number: '03',
    title: 'Product Visuals',
    summary: 'Premium AI-generated product imagery.',
    deliverableFocus: 'Studio-grade lighting, editorial surfaces, and bespoke campaign photography without physical shoot logistics.',
  },
  {
    id: 'advertising-posters',
    number: '04',
    title: 'Advertising Posters',
    summary: 'Professional promotional posters.',
    deliverableFocus: 'Print-ready and digital campaign key visuals structured around strong typographic hierarchy.',
  },
  {
    id: 'monthly-packages',
    number: '05',
    title: 'Monthly Creative Packages',
    summary: 'Consistent content for brands.',
    deliverableFocus: 'Predictable monthly production cadence keeping your brand active across reels, feeds, and paid placements.',
  },
];

export const WHY_PILLARS: WhyPillar[] = [
  {
    number: '01',
    title: 'Creative storytelling',
    description: 'Every frame serves a clear narrative arc that positions your product with intention and emotional clarity.',
  },
  {
    number: '02',
    title: 'Modern AI-powered production',
    description: 'Contemporary generative workflows guided by human art direction for cinema-grade visual fidelity.',
  },
  {
    number: '03',
    title: 'Brand-focused visuals',
    description: 'Tailored colour tone, lighting, and composition aligned strictly with your brand identity.',
  },
  {
    number: '04',
    title: 'Social-media-ready formats',
    description: 'Delivered cleanly in vertical 9:16 and widescreen 16:9 ratios ready for immediate campaign publishing.',
  },
  {
    number: '05',
    title: 'Affordable creative packages',
    description: 'Accessible monthly retainers built for emerging and growing brands without traditional studio overhead.',
  },
  {
    number: '06',
    title: 'Attention-grabbing advertising',
    description: 'Sharp opening hooks and deliberate visual contrast crafted to stop the scroll and stay memorable.',
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    step: '01',
    title: 'Discovery',
    description: 'Understand the product and brand.',
  },
  {
    step: '02',
    title: 'Creative Direction',
    description: 'Develop the concept and storyboard.',
  },
  {
    step: '03',
    title: 'Production',
    description: 'Create the advertisement.',
  },
  {
    step: '04',
    title: 'Delivery',
    description: 'Deliver the final approved content.',
  },
];

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'STARTER',
    priceLabel: '₹800',
    cadenceLabel: '/month',
    features: ['5 short advertisements.', 'Social-media-ready formats.'],
    defaultService: 'Monthly Creative Packages',
    defaultBudget: 'Starter (₹800/month)',
    customDmMessage:
      "Hi AdvantaVisuals! I'd like to start the STARTER Monthly Plan (₹800/month — 5 short ads in social-media-ready formats). Please let me know the next steps to onboard my brand.",
  },
  {
    id: 'growth',
    name: 'GROWTH',
    priceLabel: '₹1,500',
    cadenceLabel: '/month',
    features: ['10 short advertisements.', 'Consistent monthly creative content.'],
    highlighted: true,
    defaultService: 'Monthly Creative Packages',
    defaultBudget: 'Growth (₹1,500/month)',
    customDmMessage:
      "Hi AdvantaVisuals! I want to sign up for the GROWTH Monthly Plan (₹1,500/month — 10 short ads for consistent monthly content). Let's get my brand started!",
  },
  {
    id: 'custom',
    name: 'CUSTOM',
    priceLabel: 'Custom pricing',
    cadenceLabel: '',
    features: ['Posters, product visuals and larger advertising projects.'],
    defaultService: 'Product Visuals',
    defaultBudget: 'Custom Project',
    customDmMessage:
      'Hi AdvantaVisuals! I need a CUSTOM creative package (posters, product visuals, or a larger advertising campaign). Can we discuss scope and a custom quote?',
  },
];

export interface StandardPricingRow {
  id: string;
  packageName: string;
  quantityLabel: string;
  postersLabel?: string;
  specLabel: string;
  revisions: string;
  delivery: string;
  price: string;
  serviceMatch: string;
  customDmMessage?: string;
}

export interface StandardPricingGroup {
  id: 'video-ads' | 'posters' | 'combo-bundles';
  number: string;
  title: string;
  subtitle: string;
  columns: string[];
  rows: StandardPricingRow[];
}

export const STANDARD_PRICING_GROUPS: StandardPricingGroup[] = [
  {
    id: 'video-ads',
    number: '01',
    title: 'Video Ads',
    subtitle: 'Short, powerful ads to make your brand stand out.',
    columns: ['Package Name', 'Ads Included', 'Duration', 'Revisions', 'Delivery', 'Price'],
    rows: [
      {
        id: 'single-ad',
        packageName: 'Single Ad',
        quantityLabel: '1',
        specLabel: '10 sec',
        revisions: '1',
        delivery: '2–3 Days',
        price: '₹299',
        serviceMatch: 'AI Video Advertisements',
        customDmMessage:
          "Hi AdvantaVisuals! I'd like to order the Single Video Ad package (₹299 · 1 ad · 10 sec · 1 revision · 2–3 Days delivery). How should I share my product details?",
      },
      {
        id: 'starter-pack',
        packageName: 'Starter Pack',
        quantityLabel: '3',
        specLabel: '10 sec each',
        revisions: '1 / ad',
        delivery: '3–4 Days',
        price: '₹799',
        serviceMatch: 'AI Video Advertisements',
        customDmMessage:
          "Hi AdvantaVisuals! I'd like to order the Video Ads Starter Pack (₹799 · 3 ads · 10 sec each · 1 revision/ad · 3–4 Days delivery). Please share next steps!",
      },
      {
        id: 'growth-pack',
        packageName: 'Growth Pack',
        quantityLabel: '5',
        specLabel: '10 sec each',
        revisions: '1 / ad',
        delivery: '4–5 Days',
        price: '₹1,199',
        serviceMatch: 'AI Video Advertisements',
        customDmMessage:
          "Hi AdvantaVisuals! I'd like to book the Video Ads Growth Pack (₹1,199 · 5 ads · 10 sec each · 1 revision/ad · 4–5 Days delivery). Let's get started!",
      },
    ],
  },
  {
    id: 'posters',
    number: '02',
    title: 'Posters',
    subtitle: 'Custom designs that match your brand identity.',
    columns: ['Package Name', 'Posters Included', 'Format', 'Revisions', 'Delivery', 'Price'],
    rows: [
      {
        id: 'single-poster',
        packageName: 'Single Poster',
        quantityLabel: '1',
        specLabel: 'Instagram-ready',
        revisions: '1',
        delivery: '1–2 Days',
        price: '₹199',
        serviceMatch: 'Advertising Posters',
        customDmMessage:
          "Hi AdvantaVisuals! I'd like to order a Single Brand Poster (₹199 · 1 Instagram-ready poster · 1 revision · 1–2 Days delivery). Where can I send my brand brief?",
      },
      {
        id: '3-poster-pack',
        packageName: '3 Poster Pack',
        quantityLabel: '3',
        specLabel: 'Instagram-ready',
        revisions: '1 / poster',
        delivery: '2–3 Days',
        price: '₹499',
        serviceMatch: 'Advertising Posters',
        customDmMessage:
          "Hi AdvantaVisuals! I'd like to book the 3 Poster Pack (₹499 · 3 Instagram-ready posters · 1 revision/poster · 2–3 Days delivery). Please share onboarding steps!",
      },
      {
        id: '5-poster-pack',
        packageName: '5 Poster Pack',
        quantityLabel: '5',
        specLabel: 'Instagram-ready',
        revisions: '1 / poster',
        delivery: '3–4 Days',
        price: '₹799',
        serviceMatch: 'Advertising Posters',
        customDmMessage:
          "Hi AdvantaVisuals! I'd like to book the 5 Poster Pack (₹799 · 5 Instagram-ready posters · 1 revision/poster · 3–4 Days delivery). Let's discuss my brand creatives!",
      },
    ],
  },
  {
    id: 'combo-bundles',
    number: '03',
    title: 'Combo Bundles',
    subtitle: 'Get the best of both — Video Ads + Posters.',
    columns: [
      'Package Name',
      'Ads Included',
      'Posters Included',
      'Duration / Format',
      'Revisions',
      'Delivery',
      'Price',
    ],
    rows: [
      {
        id: 'starter-combo',
        packageName: 'Starter Combo',
        quantityLabel: '1',
        postersLabel: '1',
        specLabel: '10-sec + Poster',
        revisions: '1 each',
        delivery: '2–3 Days',
        price: '₹449',
        serviceMatch: 'Combo Bundles (Video Ads + Posters)',
        customDmMessage:
          "Hi AdvantaVisuals! I'd like to order the Starter Combo Bundle (₹449 · 1 video ad + 1 poster · 10-sec + Poster · 2–3 Days delivery). Ready to share my product info!",
      },
      {
        id: 'brand-combo',
        packageName: 'Brand Combo',
        quantityLabel: '3',
        postersLabel: '3',
        specLabel: '10-sec each + Posters',
        revisions: '1 each',
        delivery: '3–4 Days',
        price: '₹1,299',
        serviceMatch: 'Combo Bundles (Video Ads + Posters)',
        customDmMessage:
          "Hi AdvantaVisuals! I'd like to book the Brand Combo Bundle (₹1,299 · 3 video ads + 3 posters · 10-sec each + Posters · 3–4 Days delivery). Let's start my campaign!",
      },
      {
        id: 'growth-combo',
        packageName: 'Growth Combo',
        quantityLabel: '5',
        postersLabel: '5',
        specLabel: '10-sec each + Posters',
        revisions: '1 each',
        delivery: '4–5 Days',
        price: '₹2,099',
        serviceMatch: 'Combo Bundles (Video Ads + Posters)',
        customDmMessage:
          "Hi AdvantaVisuals! I'd like to book the Growth Combo Bundle (₹2,099 · 5 video ads + 5 posters · 10-sec each + Posters · 4–5 Days delivery). Please guide me on the next steps!",
      },
    ],
  },
];

export const STANDARD_PRICING_HIGHLIGHTS = [
  { title: 'Fast Delivery', subtitle: 'On Time, Always' },
  { title: 'Quality Work', subtitle: 'High Resolution Output' },
  { title: 'Brand Focused', subtitle: 'Your Vision, Our Priority' },
  { title: 'Affordable Rates', subtitle: 'Great Content, Great Value' },
];

