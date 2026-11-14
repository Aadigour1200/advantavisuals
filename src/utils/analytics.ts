import { AnalyticsEventType } from '../types/admin';

const VISITOR_STORAGE_KEY = 'advanta_visitor_id';

function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing) return existing;
    const created =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(VISITOR_STORAGE_KEY, created);
    return created;
  } catch {
    return 'anonymous';
  }
}

function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function detectReferrerSource(): string {
  if (typeof document === 'undefined' || !document.referrer) return 'Direct';
  try {
    const url = new URL(document.referrer);
    if (url.hostname === window.location.hostname) return 'Direct';
    if (url.hostname.includes('instagram')) return 'Instagram';
    if (url.hostname.includes('google')) return 'Google';
    if (url.hostname.includes('linkedin')) return 'LinkedIn';
    return url.hostname.replace(/^www\./, '');
  } catch {
    return 'Direct';
  }
}

export function trackAnalyticsEvent(
  type: AnalyticsEventType,
  label?: string
): void {
  try {
    const payload = {
      type,
      label: label || '',
      visitorId: getOrCreateVisitorId(),
      device: detectDeviceType(),
      referrer: detectReferrerSource(),
    };

    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Analytics must never interrupt user interactions
    });
  } catch {
    // Ignore tracking failures
  }
}
