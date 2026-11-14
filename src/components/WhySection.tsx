import { motion } from 'motion/react';
import { WHY_PILLARS } from '../config/agency';

export function WhySection() {
  return (
    <section
      id="why-advantavisuals"
      className="bg-[#09090B] text-white py-20 sm:py-28 border-b border-white/10"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Sticky Editorial Heading */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            <p className="text-xs tracking-[0.18em] text-zinc-400 uppercase">
              Studio Standard
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white text-balance">
              Why{' '}
              <span className="font-editorial italic font-normal text-zinc-300">
                AdvantaVisuals?
              </span>
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-zinc-400 max-w-md">
              We strip away unnecessary production friction and focus entirely on visual authority,
              narrative precision, and format versatility for modern digital brands.
            </p>
          </div>

          {/* Right 6 Editorial Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 border-t border-l border-white/10"
          >
            {WHY_PILLARS.map((pillar) => (
              <div
                key={pillar.number}
                className="p-7 sm:p-8 border-r border-b border-white/10 bg-[#09090B] transition-colors duration-200 hover:bg-[#111114]"
              >
                <span className="text-xs font-medium text-zinc-500 tabular-nums">
                  {pillar.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">
                  {pillar.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">
                  {pillar.description}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
