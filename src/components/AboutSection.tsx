import { useState } from 'react';
import { motion } from 'motion/react';
import studioImage from '../assets/images/about_creative_direction_1794666380426.jpg';
import { BRAND_INFO } from '../config/agency';

export function AboutSection() {
  const [imageError, setImageError] = useState(false);

  return (
    <section
      id="about"
      className="bg-[#FAFAFA] text-[#0A0A0C] py-20 sm:py-28 border-b border-black/10"
    >
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
          {/* Left Studio Visual */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 overflow-hidden border border-black/12 bg-zinc-200 min-h-[280px] sm:min-h-[380px]"
          >
            {!imageError ? (
              <img
                src={studioImage}
                alt="Creative direction studio desk with monochrome storyboards and cinema lens"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900 p-8 text-center text-white">
                <span className="font-editorial italic text-2xl">
                  {BRAND_INFO.name}
                </span>
                <span className="mt-2 text-xs text-zinc-400">
                  Independent AI Advertising Studio
                </span>
              </div>
            )}
          </motion.div>

          {/* Right Editorial Narrative */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-between space-y-8 py-2"
          >
            <div className="space-y-6">
              <p className="text-xs tracking-[0.18em] text-zinc-600 uppercase">
                About Us · The Studio
              </p>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0A0A0C] text-balance">
                Direction First.{' '}
                <span className="font-editorial italic font-medium text-zinc-700">
                  Technology Second.
                </span>
              </h2>

              <p className="text-base sm:text-lg leading-relaxed text-zinc-700">
                {BRAND_INFO.aboutCopy}
              </p>
            </div>

            <div className="pt-8 border-t border-black/10 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs text-zinc-500">Focus</p>
                <p className="mt-1 font-semibold text-[#0A0A0C]">
                  Storytelling, Direction &amp; AI Craft
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Direct Channel</p>
                <a
                  href={BRAND_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-semibold text-[#0A0A0C] underline underline-offset-4 hover:text-zinc-600"
                >
                  Instagram {BRAND_INFO.instagramHandle}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
