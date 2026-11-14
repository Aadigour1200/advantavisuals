import { motion } from 'motion/react';

interface EditorialMarqueeProps {
  items: string[];
  variant?: 'dark' | 'light';
  reverse?: boolean;
  speedSeconds?: number;
}

export function EditorialMarquee({
  items,
  variant = 'dark',
  reverse = false,
  speedSeconds = 26,
}: EditorialMarqueeProps) {
  const isDark = variant === 'dark';

  // Repeat items twice per half-track so even wide displays are continuously filled
  const halfTrackItems = [...items, ...items];

  const renderTrack = (keyPrefix: string) => (
    <div className="flex items-center shrink-0">
      {halfTrackItems.map((text, index) => (
        <span key={`${keyPrefix}-${text}-${index}`} className="inline-flex items-center">
          <span
            className={`px-5 sm:px-7 text-xs sm:text-sm tracking-[0.16em] uppercase whitespace-nowrap ${
              index % 2 === 1
                ? 'font-editorial italic normal-case tracking-normal text-base sm:text-lg'
                : 'font-medium'
            } ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}
          >
            {text}
          </span>
          <span
            aria-hidden="true"
            className={isDark ? 'text-zinc-600' : 'text-zinc-400'}
          >
            ·
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      aria-label="Studio capabilities marquee"
      className={`relative overflow-hidden py-4 sm:py-5 border-b select-none ${
        isDark
          ? 'bg-[#070708] border-white/10'
          : 'bg-[#FAFAFA] border-black/10'
      }`}
    >
      <div className="marquee-mask w-full overflow-hidden">
        <motion.div
          className="flex w-max items-center will-change-transform"
          initial={{ x: reverse ? '-50%' : '0%' }}
          animate={{ x: reverse ? '0%' : '-50%' }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: speedSeconds,
              ease: 'linear',
            },
          }}
        >
          {renderTrack('a')}
          {renderTrack('b')}
        </motion.div>
      </div>
    </div>
  );
}
