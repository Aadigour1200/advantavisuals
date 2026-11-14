import { FormEvent, useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Copy, AlertCircle, Instagram } from 'lucide-react';
import {
  BRAND_INFO,
  buildInstagramDmUrl,
  SERVICES,
  STANDARD_PRICING_GROUPS,
  triggerInstagramDmHandoff,
} from '../config/agency';
import { trackAnalyticsEvent } from '../utils/analytics';

const CONTACT_CHANNEL_DM =
  "Hi AdvantaVisuals! I'd like to discuss a new project or package for my brand.";

interface ContactSectionProps {
  preselectedService: string;
  preselectedBudget: string;
}

interface FormState {
  name: string;
  brandName: string;
  email: string;
  serviceRequired: string;
  projectBudget: string;
  projectDescription: string;
}

interface SubmissionResult {
  mode: 'configured' | 'demo';
  message: string;
  summaryText: string;
}

const MONTHLY_BUDGET_OPTIONS = [
  'Starter (₹800/month)',
  'Growth (₹1,500/month)',
  'Custom Project',
];

const ONE_TIME_BUDGET_OPTIONS = STANDARD_PRICING_GROUPS.flatMap((group) =>
  group.rows.map((row) => `${row.packageName} (${row.price})`)
);

const SERVICE_OPTIONS = [
  ...SERVICES.map((svc) => svc.title),
  'Combo Bundles (Video Ads + Posters)',
];

export function ContactSection({
  preselectedService,
  preselectedBudget,
}: ContactSectionProps) {
  const [form, setForm] = useState<FormState>({
    name: '',
    brandName: '',
    email: '',
    serviceRequired: preselectedService || SERVICES[0].title,
    projectBudget: preselectedBudget || MONTHLY_BUDGET_OPTIONS[0],
    projectDescription: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (preselectedService || preselectedBudget) {
      setForm((prev) => ({
        ...prev,
        serviceRequired: preselectedService || prev.serviceRequired,
        projectBudget: preselectedBudget || prev.projectBudget,
      }));
      setResult(null);
    }
  }, [preselectedService, preselectedBudget]);

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = 'Please enter your name.';
    if (!form.brandName.trim()) nextErrors.brandName = 'Please enter your brand name.';
    if (!form.email.trim()) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!form.serviceRequired.trim()) {
      nextErrors.serviceRequired = 'Please select a service.';
    }
    if (!form.projectBudget.trim()) {
      nextErrors.projectBudget = 'Please select a budget option.';
    }
    if (!form.projectDescription.trim() || form.projectDescription.trim().length < 12) {
      nextErrors.projectDescription =
        'Please share a short overview of your product and campaign goals (at least 12 characters).';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildBriefSummary = (data: FormState) =>
    [
      `Project Enquiry — AdvantaVisuals`,
      `Name: ${data.name.trim()}`,
      `Brand: ${data.brandName.trim()}`,
      `Email: ${data.email.trim()}`,
      `Service: ${data.serviceRequired}`,
      `Budget: ${data.projectBudget}`,
      `Brief: ${data.projectDescription.trim()}`,
    ].join('\n');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSubmitting(true);
    const summaryText = buildBriefSummary(form);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to submit enquiry right now.');
      }

      setResult({
        mode: payload?.mode === 'configured' ? 'configured' : 'demo',
        message:
          payload?.message ||
          'Your enquiry has been recorded. You can also send your project brief directly via Instagram DM to @advantavisuals.',
        summaryText,
      });
    } catch {
      // Graceful fallback if server unavailable
      setResult({
        mode: 'demo',
        message:
          'Unable to reach the studio inbox right now. Copy your brief below and send it directly via Instagram DM to @advantavisuals.',
        summaryText,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyBrief = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      id="contact"
      className="bg-[#070708] text-white py-20 sm:py-28 border-b border-white/10"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Editorial Contact Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <p className="text-xs tracking-[0.18em] text-zinc-400 uppercase">
                Start a Project · Enquiries
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white text-balance">
                Let&apos;s Shape Your Next{' '}
                <span className="font-editorial italic font-normal text-zinc-300">
                  Campaign
                </span>
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-zinc-400">
                Share your product details, desired visual direction, and package preference.
                For direct studio communication, reach us anytime on Instagram.
              </p>
            </div>

            {/* Direct Instagram Contact Block */}
            <div className="border border-white/15 bg-[#0D0D10] p-7 space-y-5">
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-400">Direct Studio Channel</p>
                <p className="text-lg font-semibold text-white">
                  Instagram {BRAND_INFO.instagramHandle}
                </p>
                <p className="text-sm text-zinc-400">
                  Send a direct message for quick project enquiries, package onboarding, and concept discussions.
                </p>
              </div>

              <a
                href={buildInstagramDmUrl(CONTACT_CHANNEL_DM)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  triggerInstagramDmHandoff('Direct Enquiry', CONTACT_CHANNEL_DM);
                  trackAnalyticsEvent('instagram_click', 'Contact Card DM');
                }}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 bg-white px-6 py-3.5 text-sm font-semibold text-[#070708] transition-colors duration-150 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
                <span>Message on Instagram</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Right Project Enquiry Form */}
          <div className="lg:col-span-7 border border-white/15 bg-[#0B0B0E] p-6 sm:p-10">
            {result ? (
              <div className="space-y-6" role="status" aria-live="polite">
                <div className="flex items-start gap-3 border-b border-white/10 pb-5">
                  <CheckCircle2
                    className="h-5 w-5 text-white shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      {result.mode === 'configured'
                        ? 'Enquiry Sent Successfully'
                        : 'Enquiry Recorded'}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-300">
                      {result.message}
                    </p>
                  </div>
                </div>

                <div className="border border-white/10 bg-[#070708] p-4">
                  <p className="text-xs text-zinc-400 mb-2">Your Project Summary</p>
                  <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-zinc-200">
                    {result.summaryText}
                  </pre>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyBrief}
                    className="inline-flex items-center gap-2 border border-white/25 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{copied ? 'Brief Copied' : 'Copy Project Brief'}</span>
                  </button>

                  <a
                    href={buildInstagramDmUrl(result.summaryText)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      triggerInstagramDmHandoff('Submitted Project Brief', result.summaryText);
                      trackAnalyticsEvent('instagram_click', 'Brief Submitted DM');
                    }}
                    className="inline-flex items-center gap-2 bg-white px-5 py-2.5 text-xs font-semibold text-[#070708] transition-colors hover:bg-zinc-200"
                  >
                    <Instagram className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Send via Instagram DM ({BRAND_INFO.instagramHandle})</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="text-xs text-zinc-400 underline underline-offset-4 hover:text-white ml-auto"
                  >
                    Edit Enquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-white">
                    Project Enquiry Form
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Direct studio review · Instagram DM available
                  </span>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="flex items-center gap-2.5 border border-white/25 bg-white/5 p-3.5 text-xs text-white"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-medium text-zinc-300 mb-2"
                    >
                      Name
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your full name"
                      aria-invalid={Boolean(errors.name)}
                      className="w-full border border-white/15 bg-[#070708] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-xs text-zinc-300">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-brand"
                      className="block text-xs font-medium text-zinc-300 mb-2"
                    >
                      Brand name
                    </label>
                    <input
                      id="contact-brand"
                      name="brandName"
                      type="text"
                      required
                      value={form.brandName}
                      onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                      placeholder="Company or label name"
                      aria-invalid={Boolean(errors.brandName)}
                      className="w-full border border-white/15 bg-[#070708] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                    />
                    {errors.brandName && (
                      <p className="mt-1.5 text-xs text-zinc-300">{errors.brandName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-medium text-zinc-300 mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@yourbrand.com"
                    aria-invalid={Boolean(errors.email)}
                    className="w-full border border-white/15 bg-[#070708] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-zinc-300">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-service"
                      className="block text-xs font-medium text-zinc-300 mb-2"
                    >
                      Service required
                    </label>
                    <select
                      id="contact-service"
                      name="serviceRequired"
                      value={form.serviceRequired}
                      onChange={(e) =>
                        setForm({ ...form, serviceRequired: e.target.value })
                      }
                      className="w-full border border-white/15 bg-[#070708] px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
                    >
                      {SERVICE_OPTIONS.map((serviceTitle) => (
                        <option key={serviceTitle} value={serviceTitle}>
                          {serviceTitle}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-budget"
                      className="block text-xs font-medium text-zinc-300 mb-2"
                    >
                      Project budget
                    </label>
                    <select
                      id="contact-budget"
                      name="projectBudget"
                      value={form.projectBudget}
                      onChange={(e) =>
                        setForm({ ...form, projectBudget: e.target.value })
                      }
                      className="w-full border border-white/15 bg-[#070708] px-4 py-3 text-sm text-white focus:border-white focus:outline-none"
                    >
                      <optgroup label="Monthly Creative Packages">
                        {MONTHLY_BUDGET_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Standard One-Time Packages">
                        {ONE_TIME_BUDGET_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-description"
                    className="block text-xs font-medium text-zinc-300 mb-2"
                  >
                    Project description
                  </label>
                  <textarea
                    id="contact-description"
                    name="projectDescription"
                    rows={4}
                    required
                    value={form.projectDescription}
                    onChange={(e) =>
                      setForm({ ...form, projectDescription: e.target.value })
                    }
                    placeholder="Tell us about your product, target format (9:16 or 16:9), visual references, and timeline."
                    aria-invalid={Boolean(errors.projectDescription)}
                    className="w-full border border-white/15 bg-[#070708] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                  />
                  {errors.projectDescription && (
                    <p className="mt-1.5 text-xs text-zinc-300">
                      {errors.projectDescription}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 bg-white px-7 py-3.5 text-sm font-semibold text-[#070708] whitespace-nowrap transition-colors duration-150 hover:bg-zinc-200 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <span>{submitting ? 'Submitting Enquiry...' : 'Submit Project Enquiry'}</span>
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <p className="text-xs text-zinc-500">
                    Prefer instant chat? Use{' '}
                    <a
                      href={BRAND_INFO.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-300 underline underline-offset-4 hover:text-white"
                    >
                      {BRAND_INFO.instagramHandle}
                    </a>
                    .
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
