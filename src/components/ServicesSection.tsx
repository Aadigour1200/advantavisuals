import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import {
  buildInstagramDmUrl,
  SERVICES,
  triggerInstagramDmHandoff,
} from '../config/agency';

interface ServicesSectionProps {
  onSelectService: (serviceTitle: string) => void;
}

export function ServicesSection({ onSelectService }: ServicesSectionProps) {
  return (
    <section
      id="services"
      className="bg-[#FAFAFA] text-[#0A0A0C] py-20 sm:py-28 border-b border-black/10"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-black/10">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs tracking-[0.18em] text-zinc-600 uppercase">
              Capabilities · Creative Production
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0A0A0C] text-balance">
              Services Built for{' '}
              <span className="font-editorial italic font-medium text-zinc-700">
                Modern Brands
              </span>
            </h2>
          </div>
          <div className="lg:col-span-5 flex items-end">
            <p className="text-sm sm:text-base leading-relaxed text-zinc-600">
              Focused creative formats engineered to communicate product value clearly, consistently,
              and with unmistakable editorial polish.
            </p>
          </div>
        </div>

        {/* Asymmetric Editorial Bento Grid for 5 Services */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6"
        >
          {SERVICES.map((service, index) => {
            // First 2 cards span 3 cols each on desktop; remaining 3 span 2 cols each
            const spanClass = index < 2 ? 'lg:col-span-3' : 'lg:col-span-2';
            const isPrimary = service.featured;

            return (
              <div
                key={service.id}
                className={`${spanClass} flex flex-col justify-between p-7 sm:p-8 border transition-colors duration-200 ${
                  isPrimary
                    ? 'bg-[#0A0A0C] text-white border-[#0A0A0C]'
                    : 'bg-white text-[#0A0A0C] border-black/12 hover:border-black/35'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium tabular-nums ${
                        isPrimary ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      {service.number}
                    </span>
                    <span
                      className={`text-xs ${
                        isPrimary ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      Service
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold tracking-tight">
                    {service.title}
                  </h3>

                  <p
                    className={`font-editorial italic text-xl ${
                      isPrimary ? 'text-zinc-200' : 'text-zinc-700'
                    }`}
                  >
                    {service.summary}
                  </p>

                  <p
                    className={`text-sm leading-relaxed ${
                      isPrimary ? 'text-zinc-400' : 'text-zinc-600'
                    }`}
                  >
                    {service.deliverableFocus}
                  </p>
                </div>

                <div
                  className={`mt-8 pt-5 border-t flex items-center justify-between ${
                    isPrimary ? 'border-white/15' : 'border-black/10'
                  }`}
                >
                  {(() => {
                    const dmMessage = `Hi AdvantaVisuals! I'm interested in your ${service.title} service for my brand. Could you share details and next steps?`;
                    return (
                      <a
                        href={buildInstagramDmUrl(dmMessage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          triggerInstagramDmHandoff(service.title, dmMessage);
                          onSelectService(service.title);
                        }}
                        className={`inline-flex items-center gap-2 text-xs font-semibold tracking-wide transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 ${
                          isPrimary
                            ? 'text-white focus-visible:outline-white'
                            : 'text-[#0A0A0C] focus-visible:outline-[#0A0A0C]'
                        }`}
                      >
                        <span>Enquire on Instagram</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
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
