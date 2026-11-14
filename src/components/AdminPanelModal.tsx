import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  LogOut,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AVMonogram } from './AVMonogram';
import {
  DEFAULT_PORTFOLIO_CATEGORIES,
  PORTFOLIO_FILMS,
  PORTFOLIO_VISUALS,
  PortfolioFilm,
  PortfolioVisualItem,
  VideoAspectRatio,
  VisualAspectRatio,
  VisualType,
} from '../config/portfolio';
import {
  PRICING_TIERS,
  PricingTier,
  STANDARD_PRICING_GROUPS,
  StandardPricingGroup,
} from '../config/agency';
import {
  AnalyticsRange,
  AnalyticsSummary,
  EnquiryRecord,
  FilmOverride,
  StudioContentOverrides,
} from '../types/admin';

const TOKEN_STORAGE_KEY = 'advanta_admin_token';

type AdminTab = 'dashboard' | 'films' | 'posters' | 'pricing' | 'enquiries' | 'security';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOverrides: StudioContentOverrides;
  onOverridesSaved: (next: StudioContentOverrides) => void;
}

export function AdminPanelModal({
  isOpen,
  onClose,
  currentOverrides,
  onOverridesSaved,
}: AdminPanelModalProps) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [hasCustomCredentials, setHasCustomCredentials] = useState(true);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('admin@advantavisuals');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Workspace state
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoSyncState, setAutoSyncState] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [uploadingFilmId, setUploadingFilmId] = useState<string | null>(null);
  const [uploadingPosterId, setUploadingPosterId] = useState<string | null>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>('7d');
  const [liveSync, setLiveSync] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [activityFilter, setActivityFilter] = useState<
    'all' | 'visit' | 'film_play' | 'package_click' | 'instagram_click'
  >('all');

  // Editable Film Overrides, Posters & Portfolio Categories
  const [filmEdits, setFilmEdits] = useState<Record<string, FilmOverride>>({});
  const [posterEdits, setPosterEdits] = useState<PortfolioVisualItem[]>(PORTFOLIO_VISUALS);
  const [portfolioCategoryEdits, setPortfolioCategoryEdits] = useState<string[]>(
    DEFAULT_PORTFOLIO_CATEGORIES
  );
  const [newCategoryName, setNewCategoryName] = useState('');

  // Quick-add Image URL form state for Posters & Product Visuals
  const [newVisualTitle, setNewVisualTitle] = useState('');
  const [newVisualUrl, setNewVisualUrl] = useState('');
  const [newVisualType, setNewVisualType] = useState<VisualType>('Brand Poster');
  const [newVisualCategory, setNewVisualCategory] = useState<string>(
    DEFAULT_PORTFOLIO_CATEGORIES[3] || 'Luxury Fragrance'
  );
  const [newVisualCustomCategory, setNewVisualCustomCategory] = useState('');
  const [newVisualAspectRatio, setNewVisualAspectRatio] =
    useState<VisualAspectRatio>('3:4');
  const [newVisualConceptNote, setNewVisualConceptNote] = useState('');
  const [uploadingNewVisual, setUploadingNewVisual] = useState(false);
  const [newVisualPreviewError, setNewVisualPreviewError] = useState(false);

  // Editable Pricing Tiers & Standard Groups
  const [tierEdits, setTierEdits] = useState<PricingTier[]>(PRICING_TIERS);
  const [standardGroupEdits, setStandardGroupEdits] = useState<StandardPricingGroup[]>(
    STANDARD_PRICING_GROUPS
  );

  // Enquiries state
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Security update state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const wasOpenRef = useRef(false);
  const dirtyRef = useRef<{ films: boolean; posters: boolean; pricing: boolean }>({
    films: false,
    posters: false,
    pricing: false,
  });
  const autoSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSyncDoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local editor state when modal opens (or when remote updates arrive for non-dirty sections)
  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (!isOpen) return;

    const initialFilms: Record<string, FilmOverride> = {};
    PORTFOLIO_FILMS.forEach((film) => {
      const ov = currentOverrides.films?.[film.id];
      initialFilms[film.id] = {
        id: film.id,
        title: ov?.title ?? film.title,
        category: ov?.category ?? film.category,
        aspectRatio: ov?.aspectRatio ?? film.aspectRatio,
        duration: ov?.duration ?? film.duration,
        videoSrc: ov?.videoSrc ?? film.videoSrc,
        conceptNote: ov?.conceptNote ?? film.conceptNote,
      };
    });

    if (justOpened || !dirtyRef.current.films) {
      setFilmEdits(initialFilms);
    }

    const nextPosters = Array.isArray(currentOverrides.posters)
      ? currentOverrides.posters
      : PORTFOLIO_VISUALS;

    if (justOpened || !dirtyRef.current.posters) {
      setPosterEdits(nextPosters);

      const categorySet = new Set<string>(
        currentOverrides.portfolioCategories?.length
          ? currentOverrides.portfolioCategories
          : DEFAULT_PORTFOLIO_CATEGORIES
      );
      Object.values(initialFilms).forEach((f) => {
        if (f.category?.trim()) categorySet.add(f.category.trim());
      });
      nextPosters.forEach((p) => {
        if (p.category?.trim()) categorySet.add(p.category.trim());
      });
      const mergedCategories = Array.from(categorySet);
      setPortfolioCategoryEdits(mergedCategories);
      if (mergedCategories.length > 0 && !mergedCategories.includes(newVisualCategory)) {
        setNewVisualCategory(mergedCategories[0]);
      }
    }

    if (justOpened || !dirtyRef.current.pricing) {
      setTierEdits(
        currentOverrides.pricingTiers?.length
          ? currentOverrides.pricingTiers
          : PRICING_TIERS
      );
      setStandardGroupEdits(
        currentOverrides.standardPricingGroups?.length
          ? currentOverrides.standardPricingGroups
          : STANDARD_PRICING_GROUPS
      );
    }

    if (justOpened) {
      dirtyRef.current = { films: false, posters: false, pricing: false };
      setAutoSyncState('idle');
    }
  }, [isOpen, currentOverrides]);

  // Verify auth session when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const verifyStatus = async () => {
      setCheckingAuth(true);
      try {
        const res = await fetch('/api/admin/status', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (cancelled) return;

        setAuthenticated(Boolean(data.authenticated));
        setHasCustomCredentials(Boolean(data.hasCustomCredentials));
        if (data.username) {
          setAdminUsername(data.username);
          setNewUsername(data.username);
        } else if (data.defaultUsernameHint) {
          setLoginUsername(data.defaultUsernameHint);
        }
      } catch {
        if (!cancelled) setAuthenticated(false);
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    };

    verifyStatus();
    return () => {
      cancelled = true;
    };
  }, [isOpen, token]);

  const loadAnalytics = useCallback(
    async (rangeOverride?: AnalyticsRange) => {
      if (!token) return;
      const targetRange = rangeOverride || analyticsRange;
      setLoadingAnalytics(true);
      try {
        const res = await fetch(
          `/api/admin/analytics?range=${encodeURIComponent(targetRange)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error('Failed to load analytics.');
        const data = (await res.json()) as AnalyticsSummary;
        setAnalytics(data);
        setHoveredBarIndex(null);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to fetch visitor analytics.'
        );
      } finally {
        setLoadingAnalytics(false);
      }
    },
    [token, analyticsRange]
  );

  // Load analytics when Dashboard tab is active or range changes
  useEffect(() => {
    if (!isOpen || !authenticated || activeTab !== 'dashboard' || !token) return;
    loadAnalytics(analyticsRange);
  }, [isOpen, authenticated, activeTab, token, analyticsRange, loadAnalytics]);

  // Real-time SSE stream for live dashboard updates
  useEffect(() => {
    if (!isOpen || !authenticated || activeTab !== 'dashboard' || !token || !liveSync) {
      setSseConnected(false);
      return;
    }

    const streamUrl = `/api/admin/analytics/stream?token=${encodeURIComponent(
      token
    )}&range=${encodeURIComponent(analyticsRange)}`;
    const eventSource = new EventSource(streamUrl);

    const handleAnalyticsEvent = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as AnalyticsSummary;
        setAnalytics(parsed);
        setSseConnected(true);
      } catch {
        // Ignore malformed frame
      }
    };

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    eventSource.addEventListener('analytics', handleAnalyticsEvent as EventListener);

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      eventSource.removeEventListener('analytics', handleAnalyticsEvent as EventListener);
      eventSource.close();
      setSseConnected(false);
    };
  }, [isOpen, authenticated, activeTab, token, analyticsRange, liveSync]);

  const filteredRecentEvents = useMemo(() => {
    if (!analytics) return [];
    if (activityFilter === 'all') return analytics.recentEvents;
    return analytics.recentEvents.filter((ev) => ev.type === activityFilter);
  }, [analytics, activityFilter]);

  // Load enquiries when switching to enquiries tab
  useEffect(() => {
    if (!isOpen || !authenticated || activeTab !== 'enquiries' || !token) return;
    let cancelled = false;

    const fetchEnquiries = async () => {
      setLoadingEnquiries(true);
      try {
        const res = await fetch('/api/admin/enquiries', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load enquiries.');
        const data = await res.json();
        if (!cancelled) {
          setEnquiries(Array.isArray(data.enquiries) ? data.enquiries : []);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Unable to fetch enquiries.'
          );
        }
      } finally {
        if (!cancelled) setLoadingEnquiries(false);
      }
    };

    fetchEnquiries();
    return () => {
      cancelled = true;
    };
  }, [isOpen, authenticated, activeTab, token]);

  const latestSyncRef = useRef({
    token,
    currentOverrides,
    filmEdits,
    posterEdits,
    portfolioCategoryEdits,
    tierEdits,
    standardGroupEdits,
    onOverridesSaved,
  });

  latestSyncRef.current = {
    token,
    currentOverrides,
    filmEdits,
    posterEdits,
    portfolioCategoryEdits,
    tierEdits,
    standardGroupEdits,
    onOverridesSaved,
  };

  const flushAutoSync = useCallback(async () => {
    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }

    const { films, posters, pricing } = dirtyRef.current;
    if (!films && !posters && !pricing) return;

    const snap = latestSyncRef.current;
    if (!snap.token) return;

    dirtyRef.current = { films: false, posters: false, pricing: false };

    const mergedCategories = Array.from(
      new Set([
        ...snap.portfolioCategoryEdits,
        ...(posters ? snap.posterEdits.map((p) => p.category.trim()).filter(Boolean) : []),
      ])
    );

    const payload: StudioContentOverrides = {
      ...snap.currentOverrides,
      ...(films ? { films: snap.filmEdits } : {}),
      ...(posters
        ? {
            posters: snap.posterEdits,
            portfolioCategories: mergedCategories,
          }
        : {}),
      ...(pricing
        ? {
            pricingTiers: snap.tierEdits,
            standardPricingGroups: snap.standardGroupEdits,
          }
        : {}),
    };

    setAutoSyncState('syncing');
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${snap.token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Auto-sync failed.');
      }
      snap.onOverridesSaved(data.content);
      setAutoSyncState('synced');
      if (autoSyncDoneTimerRef.current) {
        clearTimeout(autoSyncDoneTimerRef.current);
      }
      autoSyncDoneTimerRef.current = setTimeout(() => {
        setAutoSyncState('idle');
      }, 2200);
    } catch (err) {
      dirtyRef.current = {
        films: dirtyRef.current.films || films,
        posters: dirtyRef.current.posters || posters,
        pricing: dirtyRef.current.pricing || pricing,
      };
      setAutoSyncState('idle');
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to auto-sync changes.'
      );
    }
  }, []);

  const scheduleAutoSync = useCallback(
    (section: 'films' | 'posters' | 'pricing', delayMs = 350) => {
      dirtyRef.current[section] = true;
      if (autoSyncTimerRef.current) {
        clearTimeout(autoSyncTimerRef.current);
      }
      autoSyncTimerRef.current = setTimeout(() => {
        void flushAutoSync();
      }, delayMs);
    },
    [flushAutoSync]
  );

  useEffect(() => {
    return () => {
      if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
      if (autoSyncDoneTimerRef.current) clearTimeout(autoSyncDoneTimerRef.current);
    };
  }, []);

  const handleRequestClose = useCallback(() => {
    void flushAutoSync();
    onClose();
  }, [flushAutoSync, onClose]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleRequestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleRequestClose]);

  if (!isOpen) return null;

  const flashSuccess = (msg: string) => {
    setErrorMessage(null);
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      try {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      } catch {
        // Ignore storage restriction
      }
      setToken(data.token);
      setAuthenticated(true);
      setAdminUsername(data.username);
      setNewUsername(data.username);
      setHasCustomCredentials(Boolean(data.hasCustomCredentials));
      setLoginPassword('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setToken(null);
    setAuthenticated(false);
    setAdminUsername('');
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const updateFilmEdit = (filmId: string, patch: Partial<FilmOverride>) => {
    setFilmEdits((prev) => ({
      ...prev,
      [filmId]: { ...(prev[filmId] || { id: filmId }), ...patch },
    }));
    scheduleAutoSync('films', 350);
  };

  const handleSaveFilms = async () => {
    if (!token) return;
    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }
    dirtyRef.current.films = false;
    setSaving(true);
    setErrorMessage(null);
    try {
      const payload: StudioContentOverrides = {
        ...currentOverrides,
        films: filmEdits,
      };
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save portfolio films.');
      onOverridesSaved(data.content);
      flashSuccess('Portfolio film updates synced and published.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save portfolio films.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFilmMp4 = async (
    filmId: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingFilmId(filmId);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/upload-video', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': file.type || 'video/mp4',
          'X-Filename': file.name,
        },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'MP4 upload failed.');

      const nextFilmEdits = {
        ...filmEdits,
        [filmId]: {
          ...filmEdits[filmId],
          videoSrc: data.videoSrc,
        },
      };
      setFilmEdits(nextFilmEdits);

      // Persist immediately to content store
      const saveRes = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...currentOverrides,
          films: nextFilmEdits,
        }),
      });
      const saveData = await saveRes.json();
      if (saveRes.ok) {
        onOverridesSaved(saveData.content);
      }
      flashSuccess(`Uploaded ${data.fileName} and linked to card.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'MP4 upload failed.');
    } finally {
      setUploadingFilmId(null);
      e.target.value = '';
    }
  };

  const persistPostersAndCategories = async (
    nextPosters: PortfolioVisualItem[],
    nextCategories: string[],
    successMsg: string
  ) => {
    if (!token) return false;
    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }
    dirtyRef.current.posters = false;
    setSaving(true);
    setErrorMessage(null);
    try {
      const payload: StudioContentOverrides = {
        ...currentOverrides,
        posters: nextPosters,
        portfolioCategories: nextCategories,
      };
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save posters and visuals.');
      onOverridesSaved(data.content);
      flashSuccess(successMsg);
      return true;
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save posters and visuals.'
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSavePosters = async () => {
    const categorySet = new Set(portfolioCategoryEdits);
    posterEdits.forEach((p) => {
      if (p.category.trim()) categorySet.add(p.category.trim());
    });
    const nextCategories = Array.from(categorySet);
    setPortfolioCategoryEdits(nextCategories);
    await persistPostersAndCategories(
      posterEdits,
      nextCategories,
      'Posters, Product Visuals & category mappings saved.'
    );
  };

  const handleResetPostersDefaults = async () => {
    setPosterEdits(PORTFOLIO_VISUALS);
    setPortfolioCategoryEdits(DEFAULT_PORTFOLIO_CATEGORIES);
    await persistPostersAndCategories(
      PORTFOLIO_VISUALS,
      DEFAULT_PORTFOLIO_CATEGORIES,
      'Posters & Product Visuals restored to studio defaults.'
    );
  };

  const handleClearAllPosters = async () => {
    setPosterEdits([]);
    await persistPostersAndCategories(
      [],
      portfolioCategoryEdits,
      'All posters and product visuals cleared. The poster section is now empty and hidden on the public page.'
    );
  };

  const handleAddPortfolioCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const nextCategories = portfolioCategoryEdits.includes(trimmed)
      ? portfolioCategoryEdits
      : [...portfolioCategoryEdits, trimmed];
    setPortfolioCategoryEdits(nextCategories);
    setNewCategoryName('');
    setNewVisualCategory(trimmed);
    await persistPostersAndCategories(
      posterEdits,
      nextCategories,
      `Added portfolio category "${trimmed}".`
    );
  };

  const handleRemovePortfolioCategory = (cat: string) => {
    setPortfolioCategoryEdits((prev) => prev.filter((c) => c !== cat));
    scheduleAutoSync('posters', 120);
  };

  const handleUploadNewVisualFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingNewVisual(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': file.type || 'image/jpeg',
          'X-Filename': file.name,
        },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image upload failed.');
      setNewVisualUrl(data.imageSrc);
      if (!newVisualTitle.trim()) {
        const cleanTitle = file.name
          .replace(/\.[^.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (ch) => ch.toUpperCase());
        setNewVisualTitle(cleanTitle);
      }
      flashSuccess(`Image ${data.fileName} uploaded. Select category and click Add Visual.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingNewVisual(false);
      e.target.value = '';
    }
  };

  const handleSubmitNewVisualUrl = async (e: FormEvent) => {
    e.preventDefault();
    const imageUrl = newVisualUrl.trim();
    const title = newVisualTitle.trim();
    const resolvedCategory =
      newVisualCategory === '__custom__'
        ? newVisualCustomCategory.trim()
        : newVisualCategory.trim();

    if (!imageUrl) {
      setErrorMessage('Enter an image URL or upload an image file.');
      return;
    }
    if (!title) {
      setErrorMessage('Enter a title for the poster or product visual.');
      return;
    }
    if (!resolvedCategory) {
      setErrorMessage('Choose or create a portfolio category for this visual.');
      return;
    }

    const nextCategories = portfolioCategoryEdits.includes(resolvedCategory)
      ? portfolioCategoryEdits
      : [...portfolioCategoryEdits, resolvedCategory];
    setPortfolioCategoryEdits(nextCategories);

    const nextIndex = String(posterEdits.length + 1).padStart(2, '0');
    const newItem: PortfolioVisualItem = {
      id: `visual-${Date.now()}`,
      indexNumber: nextIndex,
      title,
      category: resolvedCategory,
      visualType: newVisualType,
      aspectRatio: newVisualAspectRatio,
      imageSrc: imageUrl,
      imageAlt: `${title} — ${resolvedCategory} ${newVisualType}`,
      conceptNote:
        newVisualConceptNote.trim() ||
        `High-resolution ${newVisualType.toLowerCase()} crafted for ${resolvedCategory} campaign direction.`,
    };

    const nextPosters = [...posterEdits, newItem];
    setPosterEdits(nextPosters);

    const saved = await persistPostersAndCategories(
      nextPosters,
      nextCategories,
      `Added "${title}" mapped to ${resolvedCategory}.`
    );
    if (saved) {
      setNewVisualTitle('');
      setNewVisualUrl('');
      setNewVisualCustomCategory('');
      setNewVisualConceptNote('');
      if (newVisualCategory === '__custom__') {
        setNewVisualCategory(resolvedCategory);
      }
    }
  };

  const handleAddPosterItem = () => {
    const nextIndex = String(posterEdits.length + 1).padStart(2, '0');
    const defaultCategory = portfolioCategoryEdits[0] || 'Luxury Fragrance';
    const newItem: PortfolioVisualItem = {
      id: `visual-${Date.now()}`,
      indexNumber: nextIndex,
      title: 'Untitled Visual Campaign',
      category: defaultCategory,
      visualType: 'Brand Poster',
      aspectRatio: '3:4',
      imageSrc: '',
      imageAlt: 'High-resolution AI brand visual campaign poster',
      conceptNote:
        'High-resolution AI product direction framed for campaign launch banners and print.',
    };
    setPosterEdits((prev) => [...prev, newItem]);
    scheduleAutoSync('posters', 120);
  };

  const handleDeletePosterItem = (id: string) => {
    setPosterEdits((prev) =>
      prev
        .filter((item) => item.id !== id)
        .map((item, idx) => ({
          ...item,
          indexNumber: String(idx + 1).padStart(2, '0'),
        }))
    );
    scheduleAutoSync('posters', 120);
  };

  const updatePosterEdit = (
    posterId: string,
    patch: Partial<PortfolioVisualItem>,
    delayMs = 350
  ) => {
    setPosterEdits((prev) =>
      prev.map((item) => (item.id === posterId ? { ...item, ...patch } : item))
    );
    scheduleAutoSync('posters', delayMs);
  };

  const handleUploadPosterImage = async (
    posterId: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingPosterId(posterId);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': file.type || 'image/jpeg',
          'X-Filename': file.name,
        },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image upload failed.');

      const nextPosters = posterEdits.map((item) =>
        item.id === posterId ? { ...item, imageSrc: data.imageSrc } : item
      );
      setPosterEdits(nextPosters);

      const saveRes = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...currentOverrides,
          posters: nextPosters,
          portfolioCategories: portfolioCategoryEdits,
        }),
      });
      const saveData = await saveRes.json();
      if (saveRes.ok) {
        onOverridesSaved(saveData.content);
      }
      flashSuccess(`Uploaded ${data.fileName} and published to Posters & Visuals.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingPosterId(null);
      e.target.value = '';
    }
  };

  const updatePricingTierEdit = (idx: number, patch: Partial<PricingTier>) => {
    setTierEdits((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
    scheduleAutoSync('pricing', 350);
  };

  const updateStandardRowEdit = (
    gIdx: number,
    rIdx: number,
    patch: Partial<StandardPricingGroup['rows'][number]>
  ) => {
    setStandardGroupEdits((prev) =>
      prev.map((group, gi) => {
        if (gi !== gIdx) return group;
        return {
          ...group,
          rows: group.rows.map((row, ri) =>
            ri === rIdx ? { ...row, ...patch } : row
          ),
        };
      })
    );
    scheduleAutoSync('pricing', 350);
  };

  const handleSavePricing = async () => {
    if (!token) return;
    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }
    dirtyRef.current.pricing = false;
    setSaving(true);
    setErrorMessage(null);
    try {
      const payload: StudioContentOverrides = {
        ...currentOverrides,
        pricingTiers: tierEdits,
        standardPricingGroups: standardGroupEdits,
      };
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save pricing.');
      onOverridesSaved(data.content);
      flashSuccess('Monthly & Normal Pricing updates published.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save pricing.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetPricingDefaults = async () => {
    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }
    dirtyRef.current.pricing = false;
    setTierEdits(PRICING_TIERS);
    setStandardGroupEdits(STANDARD_PRICING_GROUPS);
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...currentOverrides,
          pricingTiers: PRICING_TIERS,
          standardPricingGroups: STANDARD_PRICING_GROUPS,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onOverridesSaved(data.content);
        flashSuccess('Pricing restored to original studio defaults.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEnquiryStatus = async (
    id: string,
    status: EnquiryRecord['status']
  ) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status.');
      setEnquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update enquiry.'
      );
    }
  };

  const handleDeleteEnquiry = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete enquiry.');
      setEnquiries((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to delete enquiry.'
      );
    }
  };

  const handleCopyEnquiry = async (item: EnquiryRecord) => {
    const text = `Enquiry from ${item.name} (${item.brandName})\nEmail: ${item.email}\nService: ${item.serviceRequired}\nBudget: ${item.projectBudget}\nBrief: ${item.projectDescription}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleResetAnalytics = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/analytics', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to reset analytics.');
      await loadAnalytics(analyticsRange);
      flashSuccess('Visitor analytics counters have been reset.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to reset analytics.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleExportAnalyticsCsv = () => {
    if (!analytics) return;

    const escapeCell = (val: string | number | null | undefined) => {
      let str = String(val ?? '');
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      if (/[",\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows: Array<Array<string | number>> = [
      ['Category', 'Item', 'Value'],
      ['Summary', 'Timeframe', analytics.range.toUpperCase()],
      ['Summary', 'Total Visits', analytics.totalVisits],
      ['Summary', 'Today Visits', analytics.todayVisits],
      ['Summary', 'Unique Visitors', analytics.uniqueVisitors],
      ['Summary', 'Enquiries', analytics.enquiriesCount],
      ['Summary', 'Conversion Rate', `${analytics.conversionRate}%`],
      ['Summary', 'Instagram Clicks', analytics.instagramClicks],
      ...analytics.chartSeries.map((pt) => ['Visits', pt.label, pt.count]),
      ['Devices', 'Desktop', analytics.devices.desktop],
      ['Devices', 'Mobile', analytics.devices.mobile],
      ['Devices', 'Tablet', analytics.devices.tablet],
      ...analytics.topReferrers.map((ref) => ['Sources', ref.label, ref.count]),
      ...analytics.sectionFunnel.map((sec) => ['Sections', sec.label, sec.count]),
      ...analytics.topFilms.map((film) => ['Films', film.label, film.count]),
      ...analytics.topPackages.map((pkg) => ['Packages', pkg.label, pkg.count]),
    ];

    const csvContent =
      '\uFEFF' + rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `advantavisuals-analytics-${analytics.range}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    flashSuccess(`Exported ${analytics.range.toUpperCase()} analytics CSV.`);
  };

  const handleUpdateCredentials = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passcodes do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update passcode.');

      try {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      } catch {
        // Ignore
      }
      setToken(data.token);
      setAdminUsername(data.username);
      setHasCustomCredentials(true);
      setNewPassword('');
      setConfirmPassword('');
      flashSuccess('Admin login credentials updated.');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update credentials.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AdvantaVisuals Studio Admin Panel"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md"
      onClick={handleRequestClose}
    >
      <div
        className="relative flex w-full max-w-5xl max-h-[92vh] flex-col border border-white/15 bg-[#09090B] text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#070708] px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <AVMonogram className="h-7 w-7 text-white" />
            <div>
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-white">
                AdvantaVisuals Studio Admin
              </h2>
              <p className="text-[11px] text-zinc-400">
                {authenticated
                  ? `Signed in as ${adminUsername}${
                      autoSyncState === 'syncing'
                        ? ' · Auto-syncing...'
                        : autoSyncState === 'synced'
                          ? ' · Auto-synced live'
                          : ' · Auto-sync active'
                    }`
                  : 'Authorized Studio Access'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {authenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 border border-white/15 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-white/35 hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleRequestClose}
              aria-label="Close admin panel"
              className="inline-flex h-9 w-9 items-center justify-center border border-white/15 text-zinc-300 transition-colors hover:bg-white hover:text-[#070708]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          {checkingAuth ? (
            <div className="py-16 text-center text-sm text-zinc-400">
              Verifying studio session...
            </div>
          ) : !authenticated ? (
            /* LOGIN VIEW */
            <div className="mx-auto max-w-md py-6 space-y-6">
              <div className="space-y-2">
                <p className="text-xs tracking-[0.18em] text-zinc-400 uppercase">
                  Studio Console
                </p>
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  Sign in to manage{' '}
                  <span className="font-editorial italic font-normal text-zinc-300">
                    AdvantaVisuals
                  </span>
                </h3>
                <p className="text-sm text-zinc-400">
                  Manage portfolio MP4 videos, update pricing packages, and review incoming brand enquiries.
                </p>
              </div>

              {loginError && (
                <div
                  role="alert"
                  className="border border-white/25 bg-white/5 px-4 py-3 text-xs text-white"
                >
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-login-id"
                    className="block text-xs font-medium text-zinc-300 mb-1.5"
                  >
                    Studio Login ID
                  </label>
                  <input
                    id="admin-login-id"
                    type="text"
                    required
                    autoFocus
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full border border-white/15 bg-[#070708] px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-login-pass"
                    className="block text-xs font-medium text-zinc-300 mb-1.5"
                  >
                    Passcode
                  </label>
                  <div className="relative">
                    <input
                      id="admin-login-pass"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter studio passcode"
                      className="w-full border border-white/15 bg-[#070708] pl-4 pr-11 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full bg-white py-3.5 text-sm font-semibold text-[#070708] transition-colors hover:bg-zinc-200 disabled:opacity-60"
                >
                  {loggingIn ? 'Signing In...' : 'Sign In to Admin Panel'}
                </button>
              </form>

              {!hasCustomCredentials && (
                <div className="border border-white/10 bg-[#0D0D10] p-4 text-xs leading-relaxed text-zinc-400">
                  Initial studio credentials: <code className="text-zinc-200">admin@advantavisuals</code> /{' '}
                  <code className="text-zinc-200">advanta2026</code>. Update your passcode inside the Security tab after signing in.
                </div>
              )}
            </div>
          ) : (
            /* AUTHENTICATED DASHBOARD */
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-1 border-b border-white/10 pb-4">
                {(
                  [
                    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                    { id: 'films', label: 'Portfolio Films', icon: Film },
                    { id: 'posters', label: 'Posters & Visuals', icon: ImageIcon },
                    { id: 'pricing', label: 'Pricing & Rate Card', icon: Save },
                    { id: 'enquiries', label: 'Enquiries Inbox', icon: Inbox },
                    { id: 'security', label: 'Security', icon: KeyRound },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setErrorMessage(null);
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                        active
                          ? 'bg-white text-[#070708]'
                          : 'border border-white/10 text-zinc-400 hover:text-white hover:border-white/25'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Banners */}
              {statusMessage && (
                <div
                  role="status"
                  className="flex items-center gap-2 border border-white/25 bg-white/10 px-4 py-3 text-xs font-medium text-white"
                >
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div
                  role="alert"
                  className="border border-white/30 bg-white/5 px-4 py-3 text-xs text-zinc-200"
                >
                  {errorMessage}
                </div>
              )}

              {/* TAB 0: DASHBOARD & VISITOR ANALYTICS */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Dashboard Header + Timeframe & Live Controls */}
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-white">
                            Studio Traffic &amp; Conversion Overview
                          </h3>
                          {liveSync && sseConnected && (
                            <span className="inline-flex items-center gap-1.5 border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase">
                              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                              Live
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          Dynamic traffic, device split, portfolio film plays, package interest, and enquiry conversion
                          {analytics?.generatedAt
                            ? ` · Updated ${new Date(analytics.generatedAt).toLocaleTimeString()}`
                            : ''}
                          .
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLiveSync((prev) => !prev)}
                          aria-pressed={liveSync}
                          className={`inline-flex items-center gap-1.5 border px-3 py-2 text-xs font-medium transition-colors ${
                            liveSync
                              ? 'border-white bg-white text-[#070708]'
                              : 'border-white/20 text-zinc-300 hover:border-white hover:text-white'
                          }`}
                        >
                          <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{liveSync ? 'Live Sync' : 'Paused'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportAnalyticsCsv}
                          disabled={!analytics}
                          className="inline-flex items-center gap-1.5 border border-white/20 px-3 py-2 text-xs font-medium text-white transition-colors hover:border-white disabled:opacity-50"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Export CSV</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => loadAnalytics(analyticsRange)}
                          disabled={loadingAnalytics}
                          className="inline-flex items-center gap-1.5 border border-white/20 px-3 py-2 text-xs font-medium text-white transition-colors hover:border-white disabled:opacity-60"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`}
                            aria-hidden="true"
                          />
                          <span>Refresh</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleResetAnalytics}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 border border-white/15 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-white/35 hover:text-white disabled:opacity-60"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>

                    {/* Timeframe Switcher */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div
                        role="group"
                        aria-label="Analytics timeframe"
                        className="inline-flex flex-wrap border border-white/15 bg-[#070708] p-1 gap-1"
                      >
                        {(
                          [
                            { id: '24h', label: '24 Hours' },
                            { id: '7d', label: '7 Days' },
                            { id: '30d', label: '30 Days' },
                            { id: 'all', label: 'All Time' },
                          ] as const
                        ).map((opt) => {
                          const selected = analyticsRange === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setAnalyticsRange(opt.id)}
                              className={`px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                                selected
                                  ? 'bg-white text-[#070708]'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      <span className="text-[11px] text-zinc-500">
                        {analyticsRange === '24h'
                          ? 'Rolling 24-hour window (2h intervals)'
                          : analyticsRange === '7d'
                            ? 'Rolling 7-day performance'
                            : analyticsRange === '30d'
                              ? 'Rolling 30-day performance'
                              : 'Cumulative studio totals'}
                      </span>
                    </div>
                  </div>

                  {loadingAnalytics && !analytics ? (
                    <div className="py-14 text-center text-sm text-zinc-400">
                      Loading visitor analytics...
                    </div>
                  ) : analytics ? (
                    <>
                      {/* 4-Column KPI Strip */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="border border-white/12 bg-[#070708] p-5">
                          <p className="text-xs text-zinc-400">Visits ({analytics.range})</p>
                          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white tabular-nums">
                            {analytics.totalVisits}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500 tabular-nums">
                            Today: {analytics.todayVisits}
                          </p>
                        </div>

                        <div className="border border-white/12 bg-[#070708] p-5">
                          <p className="text-xs text-zinc-400">Unique Visitors</p>
                          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white tabular-nums">
                            {analytics.uniqueVisitors}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            Distinct browsers
                          </p>
                        </div>

                        <div className="border border-white/12 bg-[#070708] p-5">
                          <p className="text-xs text-zinc-400">Enquiries Submitted</p>
                          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white tabular-nums">
                            {analytics.enquiriesCount}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500 tabular-nums">
                            {analytics.conversionRate}% conversion
                          </p>
                        </div>

                        <div className="border border-white/12 bg-[#070708] p-5">
                          <p className="text-xs text-zinc-400">Instagram Clicks</p>
                          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white tabular-nums">
                            {analytics.instagramClicks}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            @advantavisuals DM links
                          </p>
                        </div>
                      </div>

                      {/* Dynamic Visits Chart + Device & Source Split */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Interactive Bar Chart */}
                        <div className="lg:col-span-7 border border-white/12 bg-[#070708] p-5 sm:p-6 space-y-5">
                          {(() => {
                            const series = analytics.chartSeries;
                            const maxCount = Math.max(1, ...series.map((d) => d.count));
                            const periodTotal = series.reduce((sum, pt) => sum + pt.count, 0);
                            const activePoint =
                              hoveredBarIndex !== null && series[hoveredBarIndex]
                                ? series[hoveredBarIndex]
                                : null;
                            const activeShare =
                              activePoint && periodTotal > 0
                                ? Math.round((activePoint.count / periodTotal) * 100)
                                : 0;
                            const chartTitle =
                              analytics.range === '24h'
                                ? 'Visits — Last 24 Hours'
                                : analytics.range === '30d'
                                  ? 'Visits — Last 30 Days'
                                  : analytics.range === 'all'
                                    ? 'Visits — Recent 14 Days'
                                    : 'Visits — Last 7 Days';

                            return (
                              <>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <h4 className="text-sm font-semibold text-white">
                                    {chartTitle}
                                  </h4>
                                  <span className="text-xs text-zinc-400 tabular-nums min-h-[1rem]">
                                    {activePoint
                                      ? `${activePoint.label} · ${activePoint.count} visit${
                                          activePoint.count === 1 ? '' : 's'
                                        } (${activeShare}%)`
                                      : `${periodTotal} total · Hover bars for details`}
                                  </span>
                                </div>

                                <div
                                  className="flex items-end gap-1.5 sm:gap-2 h-44 pt-5"
                                  onMouseLeave={() => setHoveredBarIndex(null)}
                                >
                                  {series.map((point, idx) => {
                                    const heightPct = Math.round(
                                      (point.count / maxCount) * 100
                                    );
                                    const isHovered = hoveredBarIndex === idx;
                                    const isDimmed =
                                      hoveredBarIndex !== null && hoveredBarIndex !== idx;

                                    // Keep axis labels legible on denser timeframes
                                    const showLabel =
                                      series.length <= 7 ||
                                      (series.length <= 14
                                        ? idx % 2 === 0 || idx === series.length - 1
                                        : idx % 5 === 0 || idx === series.length - 1);

                                    return (
                                      <button
                                        key={`${point.date}-${idx}`}
                                        type="button"
                                        onMouseEnter={() => setHoveredBarIndex(idx)}
                                        onFocus={() => setHoveredBarIndex(idx)}
                                        onBlur={() => setHoveredBarIndex(null)}
                                        aria-label={`${point.label}: ${point.count} visits`}
                                        className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 min-w-0 group focus:outline-none"
                                      >
                                        <span
                                          className={`text-[10px] font-medium tabular-nums transition-opacity ${
                                            series.length > 14 && !isHovered
                                              ? 'opacity-0 group-hover:opacity-100'
                                              : 'opacity-100'
                                          } ${isHovered ? 'text-white' : 'text-zinc-400'}`}
                                        >
                                          {point.count}
                                        </span>
                                        <div
                                          className={`w-full flex-1 flex items-end border transition-colors ${
                                            isHovered
                                              ? 'bg-white/[0.09] border-white/30'
                                              : 'bg-white/[0.03] border-white/5'
                                          }`}
                                        >
                                          <motion.div
                                            initial={false}
                                            animate={{
                                              height: `${
                                                point.count > 0 ? Math.max(8, heightPct) : 0
                                              }%`,
                                              opacity: isDimmed ? 0.35 : 1,
                                            }}
                                            transition={{
                                              duration: 0.3,
                                              ease: [0.22, 1, 0.36, 1],
                                            }}
                                            className="w-full bg-white"
                                          />
                                        </div>
                                        <span
                                          className={`text-[10px] whitespace-nowrap transition-colors ${
                                            isHovered
                                              ? 'text-white font-semibold'
                                              : showLabel
                                                ? 'text-zinc-500'
                                                : 'text-transparent select-none'
                                          }`}
                                        >
                                          {point.label}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Device & Referrers */}
                        <div className="lg:col-span-5 border border-white/12 bg-[#070708] p-5 sm:p-6 space-y-6">
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-white">
                              Device Breakdown
                            </h4>
                            {(() => {
                              const totalDev = Math.max(
                                1,
                                analytics.devices.desktop +
                                  analytics.devices.mobile +
                                  analytics.devices.tablet
                              );
                              const rows = [
                                { label: 'Desktop', count: analytics.devices.desktop },
                                { label: 'Mobile', count: analytics.devices.mobile },
                                { label: 'Tablet', count: analytics.devices.tablet },
                              ];
                              return (
                                <div className="space-y-2.5">
                                  {rows.map((item) => {
                                    const pct =
                                      analytics.totalVisits > 0
                                        ? Math.round((item.count / totalDev) * 100)
                                        : 0;
                                    return (
                                      <div key={item.label} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-zinc-300">{item.label}</span>
                                          <span className="text-zinc-400 tabular-nums">
                                            {item.count} ({pct}%)
                                          </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 overflow-hidden">
                                          <motion.div
                                            initial={false}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.35, ease: 'easeOut' }}
                                            className="h-full bg-white"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>

                          <div className="pt-4 border-t border-white/10 space-y-2.5">
                            <h4 className="text-sm font-semibold text-white">
                              Traffic Sources
                            </h4>
                            {analytics.topReferrers.length === 0 ? (
                              <p className="text-xs text-zinc-500">
                                No referrer data recorded in this period.
                              </p>
                            ) : (
                              <ul className="space-y-1.5 text-xs">
                                {analytics.topReferrers.slice(0, 4).map((ref) => (
                                  <li
                                    key={ref.label}
                                    className="flex items-center justify-between text-zinc-300"
                                  >
                                    <span>{ref.label}</span>
                                    <span className="tabular-nums text-zinc-400">
                                      {ref.count}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Engagement Breakdown: Section Funnel, Top Films, Top Packages */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Section Reach */}
                        <div className="border border-white/12 bg-[#070708] p-5 space-y-3">
                          <h4 className="text-sm font-semibold text-white">
                            Section Reach
                          </h4>
                          {(() => {
                            const maxReach = Math.max(
                              1,
                              ...analytics.sectionFunnel.map((s) => s.count)
                            );
                            return (
                              <ul className="space-y-2.5 text-xs">
                                {analytics.sectionFunnel.map((sec) => {
                                  const barPct =
                                    sec.count > 0
                                      ? Math.round((sec.count / maxReach) * 100)
                                      : 0;
                                  return (
                                    <li key={sec.label} className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-zinc-300">{sec.label}</span>
                                        <span className="font-semibold text-white tabular-nums">
                                          {sec.count}
                                        </span>
                                      </div>
                                      <div className="h-1 w-full bg-white/[0.07]">
                                        <motion.div
                                          initial={false}
                                          animate={{ width: `${barPct}%` }}
                                          transition={{ duration: 0.35 }}
                                          className="h-full bg-zinc-300"
                                        />
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            );
                          })()}
                        </div>

                        {/* Portfolio Film Plays */}
                        <div className="border border-white/12 bg-[#070708] p-5 space-y-3">
                          <h4 className="text-sm font-semibold text-white">
                            Top Portfolio Films
                          </h4>
                          {analytics.topFilms.length === 0 ? (
                            <p className="text-xs text-zinc-500">
                              No film plays or preview opens in this period.
                            </p>
                          ) : (
                            <ul className="space-y-2.5 text-xs">
                              {analytics.topFilms.slice(0, 5).map((film) => (
                                <li
                                  key={film.label}
                                  className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0"
                                >
                                  <span className="text-zinc-300 truncate pr-2">
                                    {film.label}
                                  </span>
                                  <span className="font-semibold text-white tabular-nums shrink-0">
                                    {film.count}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Package Interest */}
                        <div className="border border-white/12 bg-[#070708] p-5 space-y-3">
                          <h4 className="text-sm font-semibold text-white">
                            Package &amp; Service Interest
                          </h4>
                          {analytics.topPackages.length === 0 ? (
                            <p className="text-xs text-zinc-500">
                              No package or service clicks in this period.
                            </p>
                          ) : (
                            <ul className="space-y-2.5 text-xs">
                              {analytics.topPackages.slice(0, 5).map((pkg) => (
                                <li
                                  key={pkg.label}
                                  className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0"
                                >
                                  <span className="text-zinc-300 truncate pr-2">
                                    {pkg.label}
                                  </span>
                                  <span className="font-semibold text-white tabular-nums shrink-0">
                                    {pkg.count}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Recent Activity Log with Dynamic Type Filter */}
                      <div className="border border-white/12 bg-[#070708] p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-white">
                              Recent Activity
                            </h4>
                            <p className="text-[11px] text-zinc-500 tabular-nums">
                              Showing {filteredRecentEvents.length} of{' '}
                              {analytics.recentEvents.length} recent events
                            </p>
                          </div>

                          <div
                            role="group"
                            aria-label="Filter recent activity"
                            className="inline-flex flex-wrap border border-white/10 bg-[#0D0D10] p-1 gap-1"
                          >
                            {(
                              [
                                { id: 'all', label: 'All' },
                                { id: 'visit', label: 'Visits' },
                                { id: 'film_play', label: 'Films' },
                                { id: 'package_click', label: 'Packages' },
                                { id: 'instagram_click', label: 'Instagram' },
                              ] as const
                            ).map((filterOpt) => {
                              const active = activityFilter === filterOpt.id;
                              return (
                                <button
                                  key={filterOpt.id}
                                  type="button"
                                  onClick={() => setActivityFilter(filterOpt.id)}
                                  className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                    active
                                      ? 'bg-white text-[#070708]'
                                      : 'text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {filterOpt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {filteredRecentEvents.length === 0 ? (
                          <p className="text-xs text-zinc-500 py-4">
                            No matching visitor activity recorded in this window.
                          </p>
                        ) : (
                          <div className="divide-y divide-white/10 text-xs max-h-72 overflow-y-auto pr-1">
                            {filteredRecentEvents.map((ev) => (
                              <div
                                key={ev.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2.5"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="font-medium text-white truncate">
                                    {ev.label}
                                  </span>
                                  <span className="text-zinc-500">·</span>
                                  <span className="text-zinc-400 capitalize shrink-0">
                                    {ev.device}
                                  </span>
                                  <span className="text-zinc-500">·</span>
                                  <span className="text-zinc-400 shrink-0">
                                    {ev.source}
                                  </span>
                                </div>
                                <span className="text-zinc-500 tabular-nums shrink-0">
                                  {new Date(ev.timestamp).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* TAB 1: PORTFOLIO FILMS */}
              {activeTab === 'films' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Portfolio Films
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Upload video files directly or edit film titles, ratios, and descriptions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveFilms}
                      disabled={saving}
                      className="inline-flex items-center gap-2 bg-white px-5 py-2.5 text-xs font-semibold text-[#070708] transition-colors hover:bg-zinc-200 disabled:opacity-60 self-start sm:self-auto"
                    >
                      <Save className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{saving ? 'Saving...' : 'Save Film Changes'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {PORTFOLIO_FILMS.map((baseFilm: PortfolioFilm) => {
                      const edit = filmEdits[baseFilm.id] || { id: baseFilm.id };
                      const isUploading = uploadingFilmId === baseFilm.id;

                      return (
                        <div
                          key={baseFilm.id}
                          className="border border-white/12 bg-[#070708] p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                            <span className="text-xs font-semibold text-zinc-400 tabular-nums">
                              {baseFilm.indexNumber} · {baseFilm.id}
                            </span>
                            <label className="inline-flex cursor-pointer items-center gap-1.5 border border-white/20 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-white hover:text-[#070708]">
                              <Upload className="h-3 w-3" aria-hidden="true" />
                              <span>{isUploading ? 'Uploading...' : 'Upload MP4'}</span>
                              <input
                                type="file"
                                accept="video/mp4,video/*"
                                disabled={isUploading}
                                onChange={(e) => handleUploadFilmMp4(baseFilm.id, e)}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Title
                              </label>
                              <input
                                type="text"
                                value={edit.title ?? baseFilm.title}
                                onChange={(e) =>
                                  updateFilmEdit(baseFilm.id, { title: e.target.value })
                                }
                                className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Category
                              </label>
                              <input
                                type="text"
                                list="admin-portfolio-category-list"
                                value={edit.category ?? baseFilm.category}
                                onChange={(e) =>
                                  updateFilmEdit(baseFilm.id, { category: e.target.value })
                                }
                                className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Aspect Ratio
                              </label>
                              <select
                                value={edit.aspectRatio ?? baseFilm.aspectRatio}
                                onChange={(e) =>
                                  updateFilmEdit(baseFilm.id, {
                                    aspectRatio: e.target.value as VideoAspectRatio,
                                  })
                                }
                                className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                              >
                                <option value="16:9">16:9 Widescreen</option>
                                <option value="9:16">9:16 Vertical</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Duration
                              </label>
                              <input
                                type="text"
                                value={edit.duration ?? baseFilm.duration}
                                onChange={(e) =>
                                  updateFilmEdit(baseFilm.id, { duration: e.target.value })
                                }
                                className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white tabular-nums focus:border-white focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              Video Link or File Path
                            </label>
                            <input
                              type="text"
                              value={edit.videoSrc ?? ''}
                              placeholder="/videos/your-film.mp4"
                              onChange={(e) =>
                                updateFilmEdit(baseFilm.id, { videoSrc: e.target.value })
                              }
                              className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              Concept Note
                            </label>
                            <textarea
                              rows={2}
                              value={edit.conceptNote ?? baseFilm.conceptNote}
                              onChange={(e) =>
                                updateFilmEdit(baseFilm.id, { conceptNote: e.target.value })
                              }
                              className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <datalist id="admin-portfolio-category-list">
                    {portfolioCategoryEdits.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              )}

              {/* TAB: POSTERS & PRODUCT VISUALS */}
              {activeTab === 'posters' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Posters &amp; Product Visuals
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Add image URLs or upload files, and map each poster or product visual to a portfolio category.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleAddPosterItem}
                        className="inline-flex items-center gap-1.5 border border-white/25 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-[#070708]"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Add Blank Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllPosters}
                        disabled={saving || posterEdits.length === 0}
                        className="inline-flex items-center gap-1.5 border border-white/20 px-3.5 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:text-white hover:border-white/40 disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Clear All</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetPostersDefaults}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 border border-white/20 px-3.5 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:text-white hover:border-white/40 disabled:opacity-60"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Reset Defaults</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePosters}
                        disabled={saving}
                        className="inline-flex items-center gap-2 bg-white px-5 py-2.5 text-xs font-semibold text-[#070708] transition-colors hover:bg-zinc-200 disabled:opacity-60"
                      >
                        <Save className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Add Form: Image URL Upload & Portfolio Category Mapping */}
                  <form
                    onSubmit={handleSubmitNewVisualUrl}
                    className="border border-white/20 bg-[#070708] p-5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Add Poster or Product Visual by Image URL
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          Paste an external image URL or upload from your device, then map it directly to a portfolio category.
                        </p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 border border-white/20 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-white hover:text-[#070708] self-start sm:self-auto">
                        <Upload className="h-3 w-3" aria-hidden="true" />
                        <span>{uploadingNewVisual ? 'Uploading...' : 'Upload Image File'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/avif,image/*"
                          disabled={uploadingNewVisual}
                          onChange={handleUploadNewVisualFile}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      {/* URL Preview Thumb */}
                      <div className="md:col-span-2 flex flex-col items-center gap-1.5">
                        <div className="h-28 w-full max-w-[110px] overflow-hidden border border-white/15 bg-[#0D0D10] flex items-center justify-center">
                          {newVisualUrl.trim() && !newVisualPreviewError ? (
                            <img
                              src={newVisualUrl.trim()}
                              alt="New visual preview"
                              referrerPolicy="no-referrer"
                              onError={() => setNewVisualPreviewError(true)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-zinc-600" aria-hidden="true" />
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500">URL Preview</span>
                      </div>

                      {/* Form Fields */}
                      <div className="md:col-span-10 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="new-visual-url"
                              className="block text-[11px] text-zinc-300 mb-1 font-medium"
                            >
                              Image URL *
                            </label>
                            <input
                              id="new-visual-url"
                              type="text"
                              value={newVisualUrl}
                              onChange={(e) => {
                                setNewVisualUrl(e.target.value);
                                setNewVisualPreviewError(false);
                              }}
                              placeholder="https://example.com/campaign-poster.jpg or /posters/..."
                              className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="new-visual-title"
                              className="block text-[11px] text-zinc-300 mb-1 font-medium"
                            >
                              Visual Title *
                            </label>
                            <input
                              id="new-visual-title"
                              type="text"
                              value={newVisualTitle}
                              onChange={(e) => setNewVisualTitle(e.target.value)}
                              placeholder="e.g. Velvet Noir Extrait Poster"
                              className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label
                              htmlFor="new-visual-type"
                              className="block text-[11px] text-zinc-300 mb-1 font-medium"
                            >
                              Visual Type
                            </label>
                            <select
                              id="new-visual-type"
                              value={newVisualType}
                              onChange={(e) =>
                                setNewVisualType(e.target.value as VisualType)
                              }
                              className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                            >
                              <option value="Brand Poster">Brand Poster</option>
                              <option value="Product Visual">Product Visual</option>
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor="new-visual-category"
                              className="block text-[11px] text-zinc-300 mb-1 font-medium"
                            >
                              Map to Portfolio Category *
                            </label>
                            <select
                              id="new-visual-category"
                              value={newVisualCategory}
                              onChange={(e) => setNewVisualCategory(e.target.value)}
                              className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                            >
                              {portfolioCategoryEdits.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                              <option value="__custom__">+ Create New Category...</option>
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor="new-visual-ratio"
                              className="block text-[11px] text-zinc-300 mb-1 font-medium"
                            >
                              Aspect Ratio
                            </label>
                            <select
                              id="new-visual-ratio"
                              value={newVisualAspectRatio}
                              onChange={(e) =>
                                setNewVisualAspectRatio(
                                  e.target.value as VisualAspectRatio
                                )
                              }
                              className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                            >
                              <option value="3:4">3:4 Editorial Poster</option>
                              <option value="1:1">1:1 Square Post</option>
                              <option value="4:3">4:3 Landscape Visual</option>
                            </select>
                          </div>
                        </div>

                        {newVisualCategory === '__custom__' && (
                          <div>
                            <label
                              htmlFor="new-visual-custom-cat"
                              className="block text-[11px] text-zinc-300 mb-1 font-medium"
                            >
                              New Portfolio Category Name *
                            </label>
                            <input
                              id="new-visual-custom-cat"
                              type="text"
                              value={newVisualCustomCategory}
                              onChange={(e) =>
                                setNewVisualCustomCategory(e.target.value)
                              }
                              placeholder="e.g. Fine Jewelry, Footwear, Eyewear"
                              className="w-full border border-white/25 bg-[#0D0D10] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                            />
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                          <div className="flex-1">
                            <label
                              htmlFor="new-visual-note"
                              className="block text-[11px] text-zinc-300 mb-1 font-medium"
                            >
                              Concept Note
                            </label>
                            <input
                              id="new-visual-note"
                              type="text"
                              value={newVisualConceptNote}
                              onChange={(e) => setNewVisualConceptNote(e.target.value)}
                              placeholder="Short art direction note shown on the portfolio card"
                              className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 bg-white px-5 py-2.5 text-xs font-semibold text-[#070708] whitespace-nowrap transition-colors hover:bg-zinc-200 disabled:opacity-60"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{saving ? 'Adding...' : 'Add Visual to Portfolio'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Portfolio Categories Mapping Strip */}
                  <div className="border border-white/12 bg-[#070708] p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Portfolio Categories ({portfolioCategoryEdits.length})
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Manage available portfolio categories for filtering and mapping visual assets.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddPortfolioCategory();
                            }
                          }}
                          placeholder="New category name..."
                          className="w-44 border border-white/15 bg-[#0D0D10] px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddPortfolioCategory}
                          disabled={saving || !newCategoryName.trim()}
                          className="inline-flex items-center gap-1 border border-white/25 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white hover:text-[#070708] disabled:opacity-40"
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {portfolioCategoryEdits.map((cat) => {
                        const mappedCount = posterEdits.filter(
                          (p) => p.category === cat
                        ).length;
                        return (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-2 border border-white/15 bg-[#0D0D10] px-2.5 py-1 text-[11px] text-zinc-200"
                          >
                            <span>{cat}</span>
                            <span className="text-zinc-500 tabular-nums">
                              ({mappedCount})
                            </span>
                            {mappedCount === 0 && portfolioCategoryEdits.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePortfolioCategory(cat)}
                                aria-label={`Remove unused category ${cat}`}
                                className="text-zinc-500 hover:text-white transition-colors"
                              >
                                <X className="h-3 w-3" aria-hidden="true" />
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {posterEdits.length === 0 ? (
                    <div className="border border-white/12 bg-[#070708] p-10 text-center space-y-4">
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-white">
                          Poster &amp; Product Visuals Section Is Empty
                        </p>
                        <p className="text-xs text-zinc-400 max-w-md mx-auto">
                          The Brand Posters &amp; Product Visuals section is currently hidden on your public portfolio. Use the form above to add an image URL whenever you are ready, or restore defaults.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetPostersDefaults}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 border border-white/25 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white hover:text-[#070708] disabled:opacity-60"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Restore Default Posters</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {posterEdits.map((poster, idx) => {
                        const isUploading = uploadingPosterId === poster.id;
                        const updatePoster = (
                          patch: Partial<PortfolioVisualItem>,
                          delayMs = 350
                        ) => updatePosterEdit(poster.id, patch, delayMs);
                        const categoryOptions = Array.from(
                          new Set([
                            ...portfolioCategoryEdits,
                            ...(poster.category ? [poster.category] : []),
                          ])
                        );

                        return (
                          <div
                            key={poster.id}
                            className="border border-white/12 bg-[#070708] p-5 space-y-4"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                              <span className="text-xs font-semibold text-zinc-400 tabular-nums">
                                {poster.indexNumber || String(idx + 1).padStart(2, '0')} · {poster.visualType}
                              </span>
                              <div className="flex items-center gap-2">
                                <label className="inline-flex cursor-pointer items-center gap-1.5 border border-white/20 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-white hover:text-[#070708]">
                                  <Upload className="h-3 w-3" aria-hidden="true" />
                                  <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/avif,image/*"
                                    disabled={isUploading}
                                    onChange={(e) => handleUploadPosterImage(poster.id, e)}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePosterItem(poster.id)}
                                  aria-label={`Delete ${poster.title}`}
                                  className="inline-flex items-center justify-center border border-white/15 p-1.5 text-zinc-400 transition-colors hover:border-white/40 hover:text-white"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                </button>
                              </div>
                            </div>

                            {/* Live Thumbnail Preview */}
                            <div className="flex items-center gap-4 border border-white/10 bg-[#0D0D10] p-3">
                              <div className="h-20 w-16 shrink-0 overflow-hidden border border-white/15 bg-black flex items-center justify-center">
                                {poster.imageSrc ? (
                                  <img
                                    src={poster.imageSrc}
                                    alt={poster.title}
                                    referrerPolicy="no-referrer"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="h-5 w-5 text-zinc-600" aria-hidden="true" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-xs font-medium text-white truncate">
                                  {poster.title || 'Untitled Visual'}
                                </p>
                                <p className="text-[11px] text-zinc-400">
                                  {poster.aspectRatio} · {poster.category}
                                </p>
                                <p className="text-[10px] text-zinc-500 truncate">
                                  {poster.imageSrc ? poster.imageSrc : 'Paste an image URL or upload a file'}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={poster.title}
                                  onChange={(e) => updatePoster({ title: e.target.value })}
                                  className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">
                                  Portfolio Category
                                </label>
                                <select
                                  value={poster.category}
                                  onChange={(e) =>
                                    updatePoster({ category: e.target.value }, 120)
                                  }
                                  className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                                >
                                  {categoryOptions.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">
                                  Type
                                </label>
                                <select
                                  value={poster.visualType}
                                  onChange={(e) =>
                                    updatePoster({ visualType: e.target.value as VisualType }, 120)
                                  }
                                  className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                                >
                                  <option value="Brand Poster">Brand Poster</option>
                                  <option value="Product Visual">Product Visual</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">
                                  Aspect Ratio
                                </label>
                                <select
                                  value={poster.aspectRatio}
                                  onChange={(e) =>
                                    updatePoster(
                                      {
                                        aspectRatio: e.target.value as VisualAspectRatio,
                                      },
                                      120
                                    )
                                  }
                                  className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                                >
                                  <option value="3:4">3:4 Editorial Poster</option>
                                  <option value="1:1">1:1 Square Post</option>
                                  <option value="4:3">4:3 Landscape Visual</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Image URL or File Path
                              </label>
                              <input
                                type="text"
                                value={poster.imageSrc}
                                placeholder="https://example.com/poster.jpg or /posters/your-poster.jpg"
                                onChange={(e) => updatePoster({ imageSrc: e.target.value })}
                                className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">
                                Concept Note
                              </label>
                              <textarea
                                rows={2}
                                value={poster.conceptNote}
                                onChange={(e) => updatePoster({ conceptNote: e.target.value })}
                                className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PRICING & RATE CARD */}
              {activeTab === 'pricing' && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Pricing &amp; Normal Rate Card Editor
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Adjust monthly retainer rates or normal one-time package prices and delivery timelines.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleResetPricingDefaults}
                        className="inline-flex items-center gap-1.5 border border-white/20 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:text-white hover:border-white/40"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Reset Defaults</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePricing}
                        disabled={saving}
                        className="inline-flex items-center gap-2 bg-white px-5 py-2.5 text-xs font-semibold text-[#070708] transition-colors hover:bg-zinc-200 disabled:opacity-60"
                      >
                        <Save className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{saving ? 'Saving...' : 'Save Pricing'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Monthly Tiers */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                      Monthly Packages
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {tierEdits.map((tier, idx) => (
                        <div
                          key={tier.id}
                          className="border border-white/12 bg-[#070708] p-4 space-y-3"
                        >
                          <p className="text-xs font-bold tracking-widest text-zinc-300">
                            {tier.name}
                          </p>
                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              Price Label
                            </label>
                            <input
                              type="text"
                              value={tier.priceLabel}
                              onChange={(e) =>
                                updatePricingTierEdit(idx, { priceLabel: e.target.value })
                              }
                              className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white tabular-nums focus:border-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              Features (one per line)
                            </label>
                            <textarea
                              rows={3}
                              value={tier.features.join('\n')}
                              onChange={(e) =>
                                updatePricingTierEdit(idx, {
                                  features: e.target.value
                                    .split('\n')
                                    .filter((line) => line.trim().length > 0),
                                })
                              }
                              className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              Instagram DM Message
                            </label>
                            <textarea
                              rows={2}
                              value={tier.customDmMessage ?? ''}
                              placeholder={`Custom DM message for ${tier.name}`}
                              onChange={(e) =>
                                updatePricingTierEdit(idx, {
                                  customDmMessage: e.target.value,
                                })
                              }
                              className="w-full border border-white/15 bg-[#0D0D10] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Normal Rate Card Rows */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                      Normal Pricing List
                    </h4>
                    {standardGroupEdits.map((group, gIdx) => (
                      <div
                        key={group.id}
                        className="border border-white/12 bg-[#070708] p-4 space-y-3"
                      >
                        <p className="text-sm font-bold text-white">
                          {group.number}. {group.title}
                        </p>
                        <div className="space-y-2.5">
                          {group.rows.map((row, rIdx) => (
                            <div
                              key={row.id}
                              className="grid grid-cols-1 sm:grid-cols-4 gap-3 border-t border-white/10 pt-2.5"
                            >
                              <div>
                                <label className="block text-[11px] text-zinc-500 mb-1">
                                  Package
                                </label>
                                <input
                                  type="text"
                                  value={row.packageName}
                                  onChange={(e) =>
                                    updateStandardRowEdit(gIdx, rIdx, {
                                      packageName: e.target.value,
                                    })
                                  }
                                  className="w-full border border-white/15 bg-[#0D0D10] px-3 py-1.5 text-xs text-white focus:border-white focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-zinc-500 mb-1">
                                  Revisions
                                </label>
                                <input
                                  type="text"
                                  value={row.revisions}
                                  onChange={(e) =>
                                    updateStandardRowEdit(gIdx, rIdx, {
                                      revisions: e.target.value,
                                    })
                                  }
                                  className="w-full border border-white/15 bg-[#0D0D10] px-3 py-1.5 text-xs text-white focus:border-white focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-zinc-500 mb-1">
                                  Delivery
                                </label>
                                <input
                                  type="text"
                                  value={row.delivery}
                                  onChange={(e) =>
                                    updateStandardRowEdit(gIdx, rIdx, {
                                      delivery: e.target.value,
                                    })
                                  }
                                  className="w-full border border-white/15 bg-[#0D0D10] px-3 py-1.5 text-xs text-white focus:border-white focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-zinc-500 mb-1">
                                  Price
                                </label>
                                <input
                                  type="text"
                                  value={row.price}
                                  onChange={(e) =>
                                    updateStandardRowEdit(gIdx, rIdx, {
                                      price: e.target.value,
                                    })
                                  }
                                  className="w-full border border-white/15 bg-[#0D0D10] px-3 py-1.5 text-xs font-semibold text-white tabular-nums focus:border-white focus:outline-none"
                                />
                              </div>
                              <div className="sm:col-span-4">
                                <label className="block text-[11px] text-zinc-500 mb-1">
                                  Instagram DM Message
                                </label>
                                <input
                                  type="text"
                                  value={row.customDmMessage ?? ''}
                                  placeholder={`Custom DM message for ${row.packageName}`}
                                  onChange={(e) =>
                                    updateStandardRowEdit(gIdx, rIdx, {
                                      customDmMessage: e.target.value,
                                    })
                                  }
                                  className="w-full border border-white/15 bg-[#0D0D10] px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: ENQUIRIES INBOX */}
              {activeTab === 'enquiries' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Project Enquiries Inbox
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Every enquiry submitted through the website contact form is stored here for review.
                    </p>
                  </div>

                  {loadingEnquiries ? (
                    <div className="py-12 text-center text-sm text-zinc-400">
                      Loading project enquiries...
                    </div>
                  ) : enquiries.length === 0 ? (
                    <div className="border border-white/10 bg-[#070708] p-10 text-center space-y-2">
                      <p className="text-sm font-medium text-white">
                        No Enquiries Recorded Yet
                      </p>
                      <p className="text-xs text-zinc-400">
                        Submissions from the Contact form will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {enquiries.map((item) => (
                        <div
                          key={item.id}
                          className="border border-white/12 bg-[#070708] p-5 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                            <div>
                              <p className="text-sm font-bold text-white">
                                {item.name} · {item.brandName}
                              </p>
                              <p className="text-xs text-zinc-400">
                                {item.email} · {new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                aria-label={`Status for ${item.brandName}`}
                                value={item.status}
                                onChange={(e) =>
                                  handleUpdateEnquiryStatus(
                                    item.id,
                                    e.target.value as EnquiryRecord['status']
                                  )
                                }
                                className="border border-white/20 bg-[#0D0D10] px-2.5 py-1.5 text-xs text-white focus:border-white focus:outline-none"
                              >
                                <option value="New">New</option>
                                <option value="Reviewed">Reviewed</option>
                                <option value="Archived">Archived</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => handleCopyEnquiry(item)}
                                aria-label={`Copy brief from ${item.brandName}`}
                                className="inline-flex items-center gap-1 border border-white/15 px-2.5 py-1.5 text-xs text-zinc-300 hover:border-white hover:text-white"
                              >
                                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteEnquiry(item.id)}
                                aria-label={`Delete enquiry from ${item.brandName}`}
                                className="inline-flex items-center justify-center border border-white/15 p-1.5 text-zinc-400 hover:border-white hover:text-white"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-zinc-400">
                            <span className="text-zinc-200 font-medium">
                              {item.serviceRequired}
                            </span>
                            <span className="mx-2" aria-hidden="true">
                              ·
                            </span>
                            <span className="tabular-nums text-zinc-200 font-medium">
                              {item.projectBudget}
                            </span>
                          </div>

                          <p className="text-sm leading-relaxed text-zinc-300">
                            {item.projectDescription}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SECURITY */}
              {activeTab === 'security' && (
                <form
                  onSubmit={handleUpdateCredentials}
                  className="max-w-md space-y-4 border border-white/12 bg-[#070708] p-6"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Update Studio Credentials
                    </h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      Passcodes are securely encrypted on the studio server.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="sec-username"
                      className="block text-xs font-medium text-zinc-300 mb-1.5"
                    >
                      Studio Login ID
                    </label>
                    <input
                      id="sec-username"
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full border border-white/15 bg-[#0D0D10] px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sec-pass"
                      className="block text-xs font-medium text-zinc-300 mb-1.5"
                    >
                      New Passcode (min 6 characters)
                    </label>
                    <input
                      id="sec-pass"
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-white/15 bg-[#0D0D10] px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sec-pass-confirm"
                      className="block text-xs font-medium text-zinc-300 mb-1.5"
                    >
                      Confirm New Passcode
                    </label>
                    <input
                      id="sec-pass-confirm"
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-white/15 bg-[#0D0D10] px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-white px-5 py-2.5 text-xs font-semibold text-[#070708] transition-colors hover:bg-zinc-200 disabled:opacity-60"
                  >
                    <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{saving ? 'Updating...' : 'Save Credentials'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
