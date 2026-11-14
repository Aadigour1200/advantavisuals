import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'admin-store.json');
const VIDEOS_DIR = path.resolve(__dirname, 'public', 'videos');
const POSTERS_DIR = path.resolve(__dirname, 'public', 'posters');

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  crypto.createHash('sha256').update(`${__dirname}-advantavisuals-session`).digest('hex');

const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin@advantavisuals';
const DEFAULT_ADMIN_PASSCODE = process.env.ADMIN_PASSWORD || 'advanta2026';

interface StoredEnquiry {
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

interface StoredAnalyticsEvent {
  id: string;
  type: string;
  label: string;
  visitorId?: string;
  device: string;
  source: string;
  timestamp: string;
}

interface StoredAnalytics {
  totalVisits: number;
  uniqueVisitors: string[];
  dailyVisits: Record<string, number>;
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  referrers: Record<string, number>;
  filmPlays: Record<string, number>;
  packageClicks: Record<string, number>;
  sectionViews: Record<string, number>;
  instagramClicks: number;
  recentEvents: StoredAnalyticsEvent[];
  eventLog: StoredAnalyticsEvent[];
}

interface AdminStoreData {
  credentials?: {
    username: string;
    salt: string;
    passwordHash: string;
  };
  content: {
    films: Record<string, Record<string, unknown>>;
    posters?: unknown[];
    portfolioCategories?: string[];
    pricingTiers?: unknown[];
    standardPricingGroups?: unknown[];
  };
  enquiries: StoredEnquiry[];
  analytics: StoredAnalytics;
}

function getDefaultAnalytics(): StoredAnalytics {
  return {
    totalVisits: 0,
    uniqueVisitors: [],
    dailyVisits: {},
    devices: { desktop: 0, mobile: 0, tablet: 0 },
    referrers: {},
    filmPlays: {},
    packageClicks: {},
    sectionViews: {},
    instagramClicks: 0,
    recentEvents: [],
    eventLog: [],
  };
}

function getDefaultStore(): AdminStoreData {
  return {
    content: {
      films: {},
    },
    enquiries: [],
    analytics: getDefaultAnalytics(),
  };
}

async function readStore(): Promise<AdminStoreData> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AdminStoreData>;
    const defaults = getDefaultAnalytics();
    return {
      credentials: parsed.credentials,
      content: parsed.content || { films: {} },
      enquiries: Array.isArray(parsed.enquiries) ? parsed.enquiries : [],
      analytics: parsed.analytics
        ? {
            ...defaults,
            ...parsed.analytics,
            devices: {
              ...defaults.devices,
              ...(parsed.analytics.devices || {}),
            },
            uniqueVisitors: Array.isArray(parsed.analytics.uniqueVisitors)
              ? parsed.analytics.uniqueVisitors
              : [],
            recentEvents: Array.isArray(parsed.analytics.recentEvents)
              ? parsed.analytics.recentEvents
              : [],
            eventLog: Array.isArray(parsed.analytics.eventLog)
              ? parsed.analytics.eventLog
              : [],
          }
        : defaults,
    };
  } catch {
    return getDefaultStore();
  }
}

async function writeStore(data: AdminStoreData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const computed = crypto.scryptSync(password, salt, 64);
  const target = Buffer.from(storedHash, 'hex');
  if (computed.length !== target.length) return false;
  return crypto.timingSafeEqual(computed, target);
}

function createAuthToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function verifyAuthToken(token: string): { sub: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      sub: string;
      exp: number;
    };
    if (!decoded.exp || decoded.exp < Date.now()) return null;
    return { sub: decoded.sub };
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const verified = verifyAuthToken(token);
  if (!verified) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Ensure public/videos and public/posters exist and are always served cleanly
  await fs.mkdir(VIDEOS_DIR, { recursive: true });
  await fs.mkdir(POSTERS_DIR, { recursive: true });
  app.use('/videos', express.static(VIDEOS_DIR));
  app.use('/posters', express.static(POSTERS_DIR));

  // Binary upload route must precede global express.json() for video files
  app.post(
    '/api/admin/upload-video',
    requireAdminAuth,
    express.raw({
      type: ['video/mp4', 'video/quicktime', 'video/*', 'application/octet-stream'],
      limit: '100mb',
    }),
    async (req, res) => {
      try {
        const buffer = req.body as Buffer;
        if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
          res.status(400).json({ error: 'No video data received.' });
          return;
        }

        const rawName = String(req.headers['x-filename'] || 'film.mp4');
        const safeBase = path
          .basename(rawName, path.extname(rawName))
          .toLowerCase()
          .replace(/[^a-z0-9-_]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'commercial-film';

        const fileName = `${safeBase}-${Date.now()}.mp4`;
        const destPath = path.join(VIDEOS_DIR, fileName);

        await fs.mkdir(VIDEOS_DIR, { recursive: true });
        await fs.writeFile(destPath, buffer);

        res.json({ videoSrc: `/videos/${fileName}`, fileName });
      } catch (err) {
        console.error('Video upload error:', err);
        res.status(500).json({ error: 'Failed to save uploaded video.' });
      }
    }
  );

  // Binary upload route for Posters & Product Visuals images
  app.post(
    '/api/admin/upload-image',
    requireAdminAuth,
    express.raw({
      type: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/avif',
        'image/*',
        'application/octet-stream',
      ],
      limit: '25mb',
    }),
    async (req, res) => {
      try {
        const buffer = req.body as Buffer;
        if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
          res.status(400).json({ error: 'No image data received.' });
          return;
        }

        const rawName = String(req.headers['x-filename'] || 'poster.jpg');
        const rawExt = path.extname(rawName).toLowerCase();
        const contentType = String(req.headers['content-type'] || '').toLowerCase();

        const allowedExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
        let ext = allowedExts.has(rawExt) ? rawExt : '';
        if (!ext) {
          if (contentType.includes('png')) ext = '.png';
          else if (contentType.includes('webp')) ext = '.webp';
          else if (contentType.includes('avif')) ext = '.avif';
          else ext = '.jpg';
        }

        const safeBase =
          path
            .basename(rawName, path.extname(rawName))
            .toLowerCase()
            .replace(/[^a-z0-9-_]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'studio-visual';

        const fileName = `${safeBase}-${Date.now()}${ext}`;
        const destPath = path.join(POSTERS_DIR, fileName);

        await fs.mkdir(POSTERS_DIR, { recursive: true });
        await fs.writeFile(destPath, buffer);

        res.json({ imageSrc: `/posters/${fileName}`, fileName });
      } catch (err) {
        console.error('Image upload error:', err);
        res.status(500).json({ error: 'Failed to save uploaded image.' });
      }
    }
  );

  app.use(express.json({ limit: '2mb' }));

  // Connected public SSE clients listening for live studio content updates
  const contentSseClients = new Set<Response>();

  const broadcastContentUpdate = (content: AdminStoreData['content']) => {
    if (contentSseClients.size === 0) return;
    const frame = `event: content\ndata: ${JSON.stringify(content)}\n\n`;
    for (const clientRes of contentSseClients) {
      try {
        clientRes.write(frame);
      } catch {
        contentSseClients.delete(clientRes);
      }
    }
  };

  // Public site content overrides
  app.get('/api/content', async (_req, res) => {
    const store = await readStore();
    res.json(store.content);
  });

  // Real-time SSE stream for automatic website sync when admin edits content
  app.get('/api/content/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    contentSseClients.add(res);

    try {
      const store = await readStore();
      res.write(`event: content\ndata: ${JSON.stringify(store.content)}\n\n`);
    } catch {
      // Ignore initial stream error
    }

    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
        contentSseClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      contentSseClients.delete(res);
    });
  });

  // Check admin auth status & whether custom credentials are set
  app.get('/api/admin/status', async (req, res) => {
    const store = await readStore();
    const token = extractToken(req);
    const verified = token ? verifyAuthToken(token) : null;
    const hasCustomCredentials = Boolean(
      store.credentials || process.env.ADMIN_PASSWORD
    );

    res.json({
      authenticated: Boolean(verified),
      username: verified?.sub || null,
      hasCustomCredentials,
      defaultUsernameHint: hasCustomCredentials ? null : DEFAULT_ADMIN_USERNAME,
    });
  });

  // Admin login
  app.post('/api/admin/login', async (req, res) => {
    const body = req.body || {};
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !password) {
      res.status(400).json({ error: 'Enter both studio login ID and passcode.' });
      return;
    }

    const store = await readStore();
    let isValid = false;

    if (store.credentials) {
      const usernameMatches =
        username.toLowerCase() === store.credentials.username.toLowerCase();
      isValid =
        usernameMatches &&
        verifyPassword(password, store.credentials.salt, store.credentials.passwordHash);
    } else {
      const usernameMatches =
        username.toLowerCase() === DEFAULT_ADMIN_USERNAME.toLowerCase();
      const expectedBuf = Buffer.from(DEFAULT_ADMIN_PASSCODE);
      const inputBuf = Buffer.from(password);
      isValid =
        usernameMatches &&
        expectedBuf.length === inputBuf.length &&
        crypto.timingSafeEqual(expectedBuf, inputBuf);
    }

    if (!isValid) {
      res.status(401).json({ error: 'Invalid studio login ID or passcode.' });
      return;
    }

    const token = createAuthToken(username);
    res.json({
      token,
      username,
      hasCustomCredentials: Boolean(store.credentials || process.env.ADMIN_PASSWORD),
    });
  });

  // Update portfolio & pricing overrides
  app.post('/api/admin/content', requireAdminAuth, async (req, res) => {
    const body = req.body || {};
    const store = await readStore();

    store.content = {
      films:
        body.films && typeof body.films === 'object'
          ? body.films
          : store.content.films,
      posters: Array.isArray(body.posters)
        ? body.posters
        : store.content.posters,
      portfolioCategories: Array.isArray(body.portfolioCategories)
        ? body.portfolioCategories.filter((c: unknown): c is string => typeof c === 'string' && c.trim().length > 0)
        : store.content.portfolioCategories,
      pricingTiers: Array.isArray(body.pricingTiers)
        ? body.pricingTiers
        : store.content.pricingTiers,
      standardPricingGroups: Array.isArray(body.standardPricingGroups)
        ? body.standardPricingGroups
        : store.content.standardPricingGroups,
    };

    await writeStore(store);
    broadcastContentUpdate(store.content);
    res.json({ ok: true, content: store.content });
  });

  // Update admin credentials
  app.post('/api/admin/credentials', requireAdminAuth, async (req, res) => {
    const body = req.body || {};
    const newUsername =
      typeof body.username === 'string' ? body.username.trim() : '';
    const newPassword =
      typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!newUsername || newUsername.length < 3) {
      res.status(400).json({ error: 'Login ID must be at least 3 characters.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New passcode must be at least 6 characters.' });
      return;
    }

    const store = await readStore();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(newPassword, salt);

    store.credentials = {
      username: newUsername,
      salt,
      passwordHash,
    };
    await writeStore(store);

    const token = createAuthToken(newUsername);
    res.json({ ok: true, token, username: newUsername });
  });

  // List saved enquiries
  app.get('/api/admin/enquiries', requireAdminAuth, async (_req, res) => {
    const store = await readStore();
    res.json({ enquiries: store.enquiries });
  });

  // Update enquiry status
  app.patch('/api/admin/enquiries/:id', requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    const status = req.body?.status;
    if (status !== 'New' && status !== 'Reviewed' && status !== 'Archived') {
      res.status(400).json({ error: 'Invalid status value.' });
      return;
    }

    const store = await readStore();
    const index = store.enquiries.findIndex((item) => item.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }

    store.enquiries[index] = { ...store.enquiries[index], status };
    await writeStore(store);
    res.json({ enquiry: store.enquiries[index] });
  });

  // Delete enquiry
  app.delete('/api/admin/enquiries/:id', requireAdminAuth, async (req, res) => {
    const { id } = req.params;
    const store = await readStore();
    store.enquiries = store.enquiries.filter((item) => item.id !== id);
    await writeStore(store);
    res.json({ ok: true });
    void broadcastAnalyticsUpdate();
  });

  type AnalyticsRange = '24h' | '7d' | '30d' | 'all';

  const parseRange = (raw: unknown): AnalyticsRange => {
    if (raw === '24h' || raw === '7d' || raw === '30d' || raw === 'all') {
      return raw;
    }
    return '7d';
  };

  const buildAnalyticsSummary = (store: AdminStoreData, range: AnalyticsRange) => {
    const analytics = store.analytics;
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    const cutoffMs =
      range === '24h'
        ? now.getTime() - 24 * 60 * 60 * 1000
        : range === '7d'
          ? now.getTime() - 7 * 24 * 60 * 60 * 1000
          : range === '30d'
            ? now.getTime() - 30 * 24 * 60 * 60 * 1000
            : 0;

    const toSortedList = (record: Record<string, number>) =>
      Object.entries(record)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);

    const sectionDefinitions = [
      { key: 'work', label: 'Portfolio Films' },
      { key: 'services', label: 'Services' },
      { key: 'pricing', label: 'Monthly Packages' },
      { key: 'normal-pricing', label: 'Normal Pricing List' },
      { key: 'contact', label: 'Contact Form' },
    ];

    const hasEventLog = analytics.eventLog.length > 0;
    const useAllTimeLegacy = range === 'all' && !hasEventLog;

    // Filter timestamped events for windowed metrics
    const filteredEvents =
      range === 'all'
        ? analytics.eventLog
        : analytics.eventLog.filter((ev) => {
            const t = new Date(ev.timestamp).getTime();
            return Number.isFinite(t) && t >= cutoffMs;
          });

    const filteredEnquiries =
      range === 'all'
        ? store.enquiries
        : store.enquiries.filter((enq) => {
            const t = new Date(enq.createdAt).getTime();
            return Number.isFinite(t) && t >= cutoffMs;
          });

    let totalVisits = 0;
    let uniqueVisitors = 0;
    let instagramClicks = 0;
    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    const referrerMap: Record<string, number> = {};
    const filmMap: Record<string, number> = {};
    const packageMap: Record<string, number> = {};
    const sectionMap: Record<string, number> = {};

    if (useAllTimeLegacy) {
      totalVisits = analytics.totalVisits;
      uniqueVisitors = analytics.uniqueVisitors.length;
      instagramClicks = analytics.instagramClicks;
      devices.desktop = analytics.devices.desktop;
      devices.mobile = analytics.devices.mobile;
      devices.tablet = analytics.devices.tablet;
      Object.assign(referrerMap, analytics.referrers);
      Object.assign(filmMap, analytics.filmPlays);
      Object.assign(packageMap, analytics.packageClicks);
      Object.assign(sectionMap, analytics.sectionViews);
    } else if (range === 'all' && hasEventLog) {
      totalVisits = analytics.totalVisits;
      uniqueVisitors = analytics.uniqueVisitors.length;
      instagramClicks = analytics.instagramClicks;
      devices.desktop = analytics.devices.desktop;
      devices.mobile = analytics.devices.mobile;
      devices.tablet = analytics.devices.tablet;
      Object.assign(referrerMap, analytics.referrers);
      Object.assign(filmMap, analytics.filmPlays);
      Object.assign(packageMap, analytics.packageClicks);
      Object.assign(sectionMap, analytics.sectionViews);
    } else {
      const visitorSet = new Set<string>();
      for (const ev of filteredEvents) {
        if (ev.type === 'visit') {
          totalVisits += 1;
          if (ev.visitorId) visitorSet.add(ev.visitorId);
          if (ev.device === 'mobile') devices.mobile += 1;
          else if (ev.device === 'tablet') devices.tablet += 1;
          else devices.desktop += 1;
          const src = ev.source || 'Direct';
          referrerMap[src] = (referrerMap[src] || 0) + 1;
        } else if (ev.type === 'film_play' && ev.label) {
          filmMap[ev.label] = (filmMap[ev.label] || 0) + 1;
        } else if (ev.type === 'package_click' && ev.label) {
          packageMap[ev.label] = (packageMap[ev.label] || 0) + 1;
        } else if (ev.type === 'instagram_click') {
          instagramClicks += 1;
        } else if (ev.type === 'section_view' && ev.label) {
          sectionMap[ev.label] = (sectionMap[ev.label] || 0) + 1;
        }
      }
      uniqueVisitors = visitorSet.size;
    }

    // Build chart series dynamically by range
    const chartSeries: Array<{ date: string; label: string; count: number }> = [];

    if (range === '24h') {
      // 12 two-hour buckets across the last 24 hours
      for (let i = 11; i >= 0; i -= 1) {
        const bucketEnd = now.getTime() - i * 2 * 60 * 60 * 1000;
        const bucketStart = bucketEnd - 2 * 60 * 60 * 1000;
        const bucketDate = new Date(bucketEnd);
        const label = bucketDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: true,
        });
        const count = filteredEvents.filter((ev) => {
          if (ev.type !== 'visit') return false;
          const t = new Date(ev.timestamp).getTime();
          return t >= bucketStart && t < bucketEnd;
        }).length;
        chartSeries.push({
          date: bucketDate.toISOString(),
          label,
          count,
        });
      }
    } else {
      const daysCount = range === '30d' ? 30 : range === 'all' ? 14 : 7;
      for (let i = daysCount - 1; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        chartSeries.push({
          date: dateKey,
          label,
          count: analytics.dailyVisits[dateKey] || 0,
        });
      }
    }

    const enquiriesCount = filteredEnquiries.length;
    const conversionRate =
      totalVisits > 0
        ? Number(((enquiriesCount / totalVisits) * 100).toFixed(1))
        : 0;

    const recentSource =
      range === 'all'
        ? analytics.recentEvents
        : filteredEvents.filter((ev) => ev.type !== 'section_view');

    return {
      range,
      generatedAt: now.toISOString(),
      totalVisits,
      uniqueVisitors,
      todayVisits: analytics.dailyVisits[todayKey] || 0,
      enquiriesCount,
      conversionRate,
      instagramClicks,
      chartSeries,
      devices,
      topReferrers: toSortedList(referrerMap),
      topFilms: toSortedList(filmMap),
      topPackages: toSortedList(packageMap),
      sectionFunnel: sectionDefinitions.map((sec) => ({
        label: sec.label,
        count: sectionMap[sec.key] || 0,
      })),
      recentEvents: recentSource.slice(0, 25),
    };
  };

  // Connected SSE admin dashboard clients
  const sseClients = new Set<{ res: Response; range: AnalyticsRange }>();

  const broadcastAnalyticsUpdate = async () => {
    if (sseClients.size === 0) return;
    const store = await readStore();
    for (const client of sseClients) {
      try {
        const summary = buildAnalyticsSummary(store, client.range);
        client.res.write(`event: analytics\ndata: ${JSON.stringify(summary)}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    }
  };

  // Public analytics event ingestion
  app.post('/api/analytics/event', async (req, res) => {
    const body = req.body || {};
    const type = typeof body.type === 'string' ? body.type : '';
    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 120) : '';
    const visitorId =
      typeof body.visitorId === 'string' ? body.visitorId.trim().slice(0, 80) : '';
    const device: 'desktop' | 'mobile' | 'tablet' =
      body.device === 'mobile'
        ? 'mobile'
        : body.device === 'tablet'
          ? 'tablet'
          : 'desktop';
    const referrer =
      typeof body.referrer === 'string' && body.referrer.trim()
        ? body.referrer.trim().slice(0, 80)
        : 'Direct';

    const allowedTypes = new Set([
      'visit',
      'film_play',
      'package_click',
      'instagram_click',
      'section_view',
    ]);
    if (!allowedTypes.has(type)) {
      res.status(400).json({ error: 'Invalid analytics event type.' });
      return;
    }

    const store = await readStore();
    const analytics = store.analytics;
    const nowIso = new Date().toISOString();
    const todayKey = nowIso.slice(0, 10);

    if (type === 'visit') {
      analytics.totalVisits += 1;
      analytics.dailyVisits[todayKey] = (analytics.dailyVisits[todayKey] || 0) + 1;
      analytics.devices[device] = (analytics.devices[device] || 0) + 1;
      analytics.referrers[referrer] = (analytics.referrers[referrer] || 0) + 1;

      if (visitorId && !analytics.uniqueVisitors.includes(visitorId)) {
        analytics.uniqueVisitors.push(visitorId);
        if (analytics.uniqueVisitors.length > 5000) {
          analytics.uniqueVisitors.shift();
        }
      }
    } else if (type === 'film_play' && label) {
      analytics.filmPlays[label] = (analytics.filmPlays[label] || 0) + 1;
    } else if (type === 'package_click' && label) {
      analytics.packageClicks[label] = (analytics.packageClicks[label] || 0) + 1;
    } else if (type === 'instagram_click') {
      analytics.instagramClicks += 1;
    } else if (type === 'section_view' && label) {
      analytics.sectionViews[label] = (analytics.sectionViews[label] || 0) + 1;
    }

    const eventLabel =
      type === 'visit'
        ? 'Site Visit'
        : type === 'instagram_click'
          ? label || 'Instagram DM / Profile'
          : label || type;

    const eventEntry: StoredAnalyticsEvent = {
      id: crypto.randomUUID(),
      type,
      label: eventLabel,
      visitorId: visitorId || undefined,
      device,
      source: referrer,
      timestamp: nowIso,
    };

    analytics.eventLog.unshift(eventEntry);
    if (analytics.eventLog.length > 3000) {
      analytics.eventLog = analytics.eventLog.slice(0, 3000);
    }

    if (type !== 'section_view') {
      analytics.recentEvents.unshift(eventEntry);
      if (analytics.recentEvents.length > 40) {
        analytics.recentEvents = analytics.recentEvents.slice(0, 40);
      }
    }

    await writeStore(store);
    res.json({ ok: true });
    void broadcastAnalyticsUpdate();
  });

  // Admin analytics dashboard summary (supports ?range=24h|7d|30d|all)
  app.get('/api/admin/analytics', requireAdminAuth, async (req, res) => {
    const store = await readStore();
    const range = parseRange(req.query.range);
    res.json(buildAnalyticsSummary(store, range));
  });

  // Admin real-time SSE stream for dynamic dashboard updates
  app.get('/api/admin/analytics/stream', async (req, res) => {
    const token =
      typeof req.query.token === 'string'
        ? req.query.token
        : extractToken(req);

    if (!token || !verifyAuthToken(token)) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const range = parseRange(req.query.range);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const client = { res, range };
    sseClients.add(client);

    const store = await readStore();
    const initialSummary = buildAnalyticsSummary(store, range);
    res.write(`event: analytics\ndata: ${JSON.stringify(initialSummary)}\n\n`);

    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(client);
    });
  });

  // Reset analytics stats
  app.delete('/api/admin/analytics', requireAdminAuth, async (_req, res) => {
    const store = await readStore();
    store.analytics = getDefaultAnalytics();
    await writeStore(store);
    res.json({ ok: true });
    void broadcastAnalyticsUpdate();
  });

  // Public contact form endpoint (also logs enquiry into Admin Inbox!)
  app.post('/api/contact', async (req, res) => {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const brandName = typeof body.brandName === 'string' ? body.brandName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const serviceRequired =
      typeof body.serviceRequired === 'string' ? body.serviceRequired.trim() : '';
    const projectBudget =
      typeof body.projectBudget === 'string' ? body.projectBudget.trim() : '';
    const projectDescription =
      typeof body.projectDescription === 'string' ? body.projectDescription.trim() : '';

    if (!name || !brandName || !email || !projectDescription) {
      res.status(400).json({
        error: 'Please complete all required fields before submitting.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: 'Please provide a valid email address.',
      });
      return;
    }

    // Save into Admin Inbox
    try {
      const store = await readStore();
      const record: StoredEnquiry = {
        id: crypto.randomUUID(),
        name,
        brandName,
        email,
        serviceRequired,
        projectBudget,
        projectDescription,
        status: 'New',
        createdAt: new Date().toISOString(),
      };
      store.enquiries.unshift(record);
      await writeStore(store);
      void broadcastAnalyticsUpdate();
    } catch (err) {
      console.error('Failed to persist enquiry to admin store:', err);
    }

    const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            brandName,
            email,
            serviceRequired,
            projectBudget,
            projectDescription,
            submittedAt: new Date().toISOString(),
          }),
        });

        if (!webhookResponse.ok) {
          throw new Error(`Webhook responded with ${webhookResponse.status}`);
        }

        res.json({
          mode: 'configured',
          message:
            'Thank you. Your project enquiry has been forwarded to AdvantaVisuals.',
        });
        return;
      } catch (err) {
        console.error('Contact webhook forwarding error:', err);
        res.status(502).json({
          error:
            'Unable to reach the configured enquiry endpoint. Please message @advantavisuals on Instagram.',
        });
        return;
      }
    }

    res.json({
      mode: 'demo',
      message:
        'Your enquiry has been saved to our studio inbox. You can also copy your brief below and send it directly via Instagram DM to @advantavisuals.',
    });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AdvantaVisuals server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
