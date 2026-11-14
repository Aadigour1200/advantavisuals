import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import {
  buildInstagramDmUrl,
  STANDARD_PRICING_GROUPS,
  STANDARD_PRICING_HIGHLIGHTS,
  StandardPricingGroup,
  StandardPricingRow,
  triggerInstagramDmHandoff,
} from '../config/agency';

type GroupFilter = 'all' | StandardPricingGroup['id'];

interface StandardPricingSectionProps {
  onSelectPackage: (serviceTitle: string, budgetLabel: string) => void;
  groups?: StandardPricingGroup[];
}

export function StandardPricingSection({
  onSelectPackage,
  groups,
}: StandardPricingSectionProps) {
  const [activeGroup, setActiveGroup] = useState<GroupFilter>('all');

  const sourceGroups = groups?.length ? groups : STANDARD_PRICING_GROUPS;

  const visibleGroups =
    activeGroup === 'all'
      ? sourceGroups
      : sourceGroups.filter((group) => group.id === activeGroup);

  const buildPackageDmMessage = (
    groupTitle: string,
    row: StandardPricingRow
  ) =>
    row.customDmMessage?.trim() ||
    `Hi AdvantaVisuals! I'd like to book the ${row.packageName} under ${groupTitle} (${row.price} · ${row.specLabel} · ${row.delivery}). How do we get started?`;

  const handleChooseRow = (groupTitle: string, row: StandardPricingRow) => {
    const dm = buildPackageDmMessage(groupTitle, row);
    triggerInstagramDmHandoff(`${row.packageName} (${row.price})`, dm);
    onSelectPackage(row.serviceMatch, `${row.packageName} (${row.price})`);
  };

  return (
    <section
      id="normal-pricing"
      className="bg-[#0B0B0E] text-white py-20 sm:py-28 border-b border-white/10"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        {/* Header & Category Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-white/10">
          <div className="space-y-4 max-w-2xl">
            <p className="text-xs tracking-[0.18em] text-zinc-400 uppercase">
              Standard Rate Card · One-Time Packages
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white text-balance">
              Normal{' '}
              <span className="font-editorial italic font-normal text-zinc-300">
                Pricing List
              </span>
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-400">
              High-quality content. Affordable packages. Made for your brand across single deliverables and value bundles.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter normal pricing categories"
            className="inline-flex flex-wrap items-center gap-1 border border-white/15 bg-[#070708] p-1 self-start lg:self-auto"
          >
            {(
              [
                { value: 'all', label: 'All Categories' },
                { value: 'video-ads', label: 'Video Ads' },
                { value: 'posters', label: 'Posters' },
                { value: 'combo-bundles', label: 'Combo Bundles' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveGroup(tab.value)}
                className={`px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-white ${
                  activeGroup === tab.value
                    ? 'bg-white text-[#070708]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rate Tables with Dynamic Scroll & Category Transitions */}
        <div className="mt-12 space-y-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeGroup}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-10"
            >
              {visibleGroups.map((group, groupIdx) => {
                const isCombo = group.id === 'combo-bundles';

                return (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{
                      duration: 0.45,
                      delay: groupIdx * 0.06,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="border border-white/12 bg-[#070708] overflow-hidden"
                  >
                    {/* Group Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 sm:px-8 border-b border-white/10 bg-[#0E0E12]">
                      <div className="flex items-baseline gap-3">
                        <span className="text-xs font-medium text-zinc-500 tabular-nums">
                          {group.number}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                          {group.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-400">
                        {group.subtitle}
                      </p>
                    </div>

                    {/* Desktop Table (No Inner Horizontal Scrollbar) */}
                    <div className="hidden lg:block w-full">
                      <table className="w-full table-auto text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-[11px] font-semibold tracking-[0.1em] text-zinc-400 uppercase">
                            {group.columns.map((col) => (
                              <th key={col} scope="col" className="px-3.5 xl:px-5 py-4 leading-snug">
                                {col}
                              </th>
                            ))}
                            <th scope="col" className="px-3.5 xl:px-5 py-4 text-right">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 text-sm">
                          {group.rows.map((row) => (
                            <tr
                              key={row.id}
                              className="transition-colors duration-150 hover:bg-white/[0.03]"
                            >
                              <td className="px-3.5 xl:px-5 py-4.5 font-semibold text-white">
                                {row.packageName}
                              </td>
                              <td className="px-3.5 xl:px-5 py-4.5 text-zinc-300 tabular-nums">
                                {row.quantityLabel}
                              </td>
                              {isCombo && (
                                <td className="px-3.5 xl:px-5 py-4.5 text-zinc-300 tabular-nums">
                                  {row.postersLabel}
                                </td>
                              )}
                              <td className="px-3.5 xl:px-5 py-4.5 text-zinc-300">
                                {row.specLabel}
                              </td>
                              <td className="px-3.5 xl:px-5 py-4.5 text-zinc-300 tabular-nums">
                                {row.revisions}
                              </td>
                              <td className="px-3.5 xl:px-5 py-4.5 text-zinc-300 tabular-nums whitespace-nowrap">
                                {row.delivery}
                              </td>
                              <td className="px-3.5 xl:px-5 py-4.5 font-bold text-white tabular-nums whitespace-nowrap text-base">
                                {row.price}
                              </td>
                              <td className="px-3.5 xl:px-5 py-4.5 text-right whitespace-nowrap">
                                <a
                                  href={buildInstagramDmUrl(
                                    buildPackageDmMessage(group.title, row)
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleChooseRow(group.title, row)}
                                  className="inline-flex items-center gap-1.5 border border-white/25 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap transition-colors duration-150 hover:bg-white hover:text-[#070708] focus-visible:outline-2 focus-visible:outline-white"
                                >
                                  <span>Select</span>
                                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  {/* Mobile & Tablet Card Grid (Zero Horizontal Scrollbar) */}
                  <div className="divide-y divide-white/10 lg:hidden">
                    {group.rows.map((row) => (
                      <div key={row.id} className="p-5 sm:p-6 space-y-4">
                        <div className="flex items-baseline justify-between gap-4">
                          <h4 className="text-base sm:text-lg font-bold text-white">
                            {row.packageName}
                          </h4>
                          <span className="text-xl font-extrabold text-white tabular-nums">
                            {row.price}
                          </span>
                        </div>

                        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs">
                          <div>
                            <dt className="text-zinc-500">
                              {group.id === 'posters' ? 'Posters Included' : 'Ads Included'}
                            </dt>
                            <dd className="mt-0.5 text-zinc-200 tabular-nums">
                              {row.quantityLabel}
                            </dd>
                          </div>

                          {isCombo && row.postersLabel && (
                            <div>
                              <dt className="text-zinc-500">Posters Included</dt>
                              <dd className="mt-0.5 text-zinc-200 tabular-nums">
                                {row.postersLabel}
                              </dd>
                            </div>
                          )}

                          <div>
                            <dt className="text-zinc-500">
                              {group.id === 'posters'
                                ? 'Format'
                                : isCombo
                                  ? 'Duration / Format'
                                  : 'Duration'}
                            </dt>
                            <dd className="mt-0.5 text-zinc-200">{row.specLabel}</dd>
                          </div>

                          <div>
                            <dt className="text-zinc-500">Revisions</dt>
                            <dd className="mt-0.5 text-zinc-200 tabular-nums">
                              {row.revisions}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-zinc-500">Delivery</dt>
                            <dd className="mt-0.5 text-zinc-200 tabular-nums">
                              {row.delivery}
                            </dd>
                          </div>
                        </dl>

                        <a
                          href={buildInstagramDmUrl(
                            buildPackageDmMessage(group.title, row)
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleChooseRow(group.title, row)}
                          className="flex w-full sm:w-auto items-center justify-center gap-2 border border-white/25 py-2.5 px-5 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-[#070708]"
                        >
                          <span>Select {row.packageName}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom 4-Column Highlights Strip */}
        <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          {STANDARD_PRICING_HIGHLIGHTS.map((item) => (
            <div key={item.title}>
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-zinc-400">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
