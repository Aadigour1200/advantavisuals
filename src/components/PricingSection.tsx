import { motion } from 'motion/react';
import { ArrowUpRight, Check } from 'lucide-react';
import {
  buildInstagramDmUrl,
  PRICING_TIERS,
  PricingTier,
  triggerInstagramDmHandoff,
} from '../config/agency';

interface PricingSectionProps {
  onSelectTier: (tier: PricingTier) => void;
  tiers?: PricingTier[];
}

export function PricingSection({ onSelectTier, tiers }: PricingSectionProps) {
  const activeTiers = tiers?.length ? tiers : PRICING_TIERS;

  return (
    <section
      id="pricing"
      className="bg-[#070708] text-white py-20 sm:py-28 border-b border-white/10"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-white/10">
          <div className="space-y-4 max-w-2xl">
            <p className="text-xs tracking-[0.18em] text-zinc-400 uppercase">
              Investment · Monthly &amp; Custom Packages
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white text-balance">
              Transparent{' '}
              <span className="font-editorial italic font-normal text-zinc-300">
                Creative Packages
              </span>
            </h2>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-zinc-400 max-w-md">
            Straightforward India-based monthly creative packages or bespoke project scopes tailored to your campaign needs.
          </p>
        </div>

        {/* Pricing Grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch"
        >
          {activeTiers.map((tier) => {
            const isHighlighted = Boolean(tier.highlighted);

            return (
              <div
                key={tier.id}
                className={`flex flex-col justify-between p-8 sm:p-10 border transition-colors duration-200 ${
                  isHighlighted
                    ? 'bg-white text-[#070708] border-white'
                    : 'bg-[#0D0D10] text-white border-white/15 hover:border-white/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h3
                      className={`text-xs font-bold tracking-[0.2em] ${
                        isHighlighted ? 'text-zinc-600' : 'text-zinc-400'
                      }`}
                    >
                      {tier.name}
                    </h3>
                    {isHighlighted && (
                      <span className="text-xs font-medium text-zinc-600">
                        Recommended
                      </span>
                    )}
                  </div>

                  <div className="mt-6 pb-6 border-b border-current/12 flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums">
                      {tier.priceLabel}
                    </span>
                    {tier.cadenceLabel && (
                      <span
                        className={`text-sm font-medium ${
                          isHighlighted ? 'text-zinc-600' : 'text-zinc-400'
                        }`}
                      >
                        {tier.cadenceLabel}
                      </span>
                    )}
                  </div>

                  <ul className="mt-8 space-y-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm sm:text-base">
                        <Check
                          className={`h-4 w-4 mt-1 shrink-0 ${
                            isHighlighted ? 'text-[#070708]' : 'text-zinc-300'
                          }`}
                          aria-hidden="true"
                        />
                        <span
                          className={
                            isHighlighted ? 'text-zinc-800' : 'text-zinc-300'
                          }
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-10 pt-6 border-t border-current/12">
                  {(() => {
                    const fallbackDm =
                      tier.id === 'custom'
                        ? `Hi AdvantaVisuals! I'd like to discuss a Custom pricing project for my brand (posters, product visuals, or campaign ads).`
                        : `Hi AdvantaVisuals! I'd like to get started with the ${tier.name} Monthly Package (${tier.priceLabel}${tier.cadenceLabel}). Please share the onboarding details!`;
                    const dmMessage = tier.customDmMessage?.trim() || fallbackDm;

                    return (
                      <a
                        href={buildInstagramDmUrl(dmMessage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          triggerInstagramDmHandoff(
                            `${tier.name} (${tier.priceLabel}${tier.cadenceLabel})`,
                            dmMessage
                          );
                          onSelectTier(tier);
                        }}
                        className={`flex w-full items-center justify-center gap-2 py-3.5 px-6 text-sm font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                          isHighlighted
                            ? 'bg-[#070708] text-white hover:bg-zinc-800 focus-visible:outline-[#070708]'
                            : 'bg-white text-[#070708] hover:bg-zinc-200 focus-visible:outline-white'
                        }`}
                      >
                        <span>Get Started</span>
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
