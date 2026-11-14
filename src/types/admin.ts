import { PortfolioVisualItem, VideoAspectRatio } from '../config/portfolio';
import { PricingTier, StandardPricingGroup } from '../config/agency';

export interface FilmOverride {
  id: string;
  title?: string;
  category?: string;
  aspectRatio?: VideoAspectRatio;
  duration?: string;
  videoSrc?: string;
  conceptNote?: string;
}

export interface StudioContentOverrides {
  films?: Record<string, FilmOverride>;
  posters?: PortfolioVisualItem[];
  portfolioCategories?: string[];
  pricingTiers?: PricingTier[];
  standardPricingGroups?: StandardPricingGroup[];
}

export interface EnquiryRecord {
  id: string;
  name: string;
  brandName: string;
  email: string;
  serviceRequired: string;
  projectBudget: string;
  projectDescription: string;
  status: 'New' | 'Reviewed' | 'Archived';
  createdAt: string;
}

export type AnalyticsEventType =
  | 'visit'
  | 'film_play'
  | 'package_click'
  | 'instagram_click'
  | 'section_view';

export type AnalyticsRange = '24h' | '7d' | '30d' | 'all';

export interface DailyVisitPoint {
  date: string;
  label: string;
  count: number;
}

export interface AnalyticsCountItem {
  label: string;
  count: number;
}

export interface RecentActivityItem {
  id: string;
  type: AnalyticsEventType;
  label: string;
  device: string;
  source: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  range: AnalyticsRange;
  generatedAt: string;
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  enquiriesCount: number;
  conversionRate: number;
  instagramClicks: number;
  chartSeries: DailyVisitPoint[];
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  topReferrers: AnalyticsCountItem[];
  topFilms: AnalyticsCountItem[];
  topPackages: AnalyticsCountItem[];
  sectionFunnel: AnalyticsCountItem[];
  recentEvents: RecentActivityItem[];
}
