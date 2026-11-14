import { motion } from 'motion/react';
import { PROCESS_STEPS } from '../config/agency';

export function ProcessSection() {
  return (
    <section
      id="process"
      className="bg-[#F5F5F6] text-[#0A0A0C] py-20 sm:py-28 border-b border-black/10"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-12 border-b border-black/10">
          <div className="space-y-4 max-w-2xl">
            <p className="text-xs tracking-[0.18em] text-zinc-600 uppercase">
              Workflow · From Brief to Master
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0A0A0C] text-balance">
              Our{' '}
              <span className="font-editorial italic font-medium text-zinc-700">
                Process
              </span>
            </h2>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-zinc-600 max-w-md">
            Four deliberate stages designed to take your product from initial positioning to ready-to-publish campaign assets.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {PROCESS_STEPS.map((item, idx) => (
            <div
              key={item.step}
              className="relative flex flex-col justify-between bg-white border border-black/12 p-7 sm:p-8"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-black/10">
                  <span className="text-3xl font-bold tracking-tight text-[#0A0A0C] tabular-nums">
                    {item.step}
                  </span>
                  <span className="text-xs text-zinc-500 tabular-nums">
                    Step {idx + 1} of 4
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold tracking-tight text-[#0A0A0C]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  {item.description}
                </p>
              </div>

              <div className="mt-8 h-px w-full bg-black/10">
                <div
                  className="h-full bg-[#0A0A0C]"
                  style={{ width: `${(idx + 1) * 25}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
