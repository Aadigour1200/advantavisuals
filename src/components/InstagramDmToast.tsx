import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Check, Copy, Instagram, X } from 'lucide-react';
import { copyTextReliably, DmHandoffDetail } from '../config/agency';

export function InstagramDmToast() {
  const [handoff, setHandoff] = useState<DmHandoffDetail | null>(null);
  const [copiedJustNow, setCopiedJustNow] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<DmHandoffDetail>;
      if (!customEvent.detail) return;
      setHandoff(customEvent.detail);
      setCopiedJustNow(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setHandoff(null);
      }, 14000);
    };

    window.addEventListener('advanta:dm-handoff', handleEvent);
    return () => {
      window.removeEventListener('advanta:dm-handoff', handleEvent);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleCopyAgain = () => {
    if (!handoff) return;
    copyTextReliably(handoff.message);
    setCopiedJustNow(true);
  };

  return (
    <AnimatePresence>
      {handoff && (
        <motion.aside
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
          aria-label="Instagram DM message copied"
          className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] sm:w-[400px] border border-white/25 bg-[#09090B]/95 p-5 text-white shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center border border-white/20 bg-white text-[#070708]">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Message Copied for Instagram DM
                </p>
                <p className="text-[11px] text-zinc-400">{handoff.label}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHandoff(null)}
              aria-label="Dismiss notification"
              className="p-1 text-zinc-400 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-zinc-300">
            Instagram does not auto-fill web chat inputs—simply{' '}
            <span className="font-semibold text-white">Paste (Ctrl+V / Tap Paste)</span>{' '}
            into the @advantavisuals chat box.
          </p>

          <div className="mt-3 border border-white/10 bg-[#050506] p-3 text-xs leading-relaxed text-zinc-300 max-h-24 overflow-y-auto">
            {handoff.message}
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleCopyAgain}
              className="inline-flex items-center gap-1.5 border border-white/20 px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:border-white hover:bg-white/5"
            >
              <Copy className="h-3 w-3" aria-hidden="true" />
              <span>{copiedJustNow ? 'Copied to Clipboard' : 'Copy Message'}</span>
            </button>

            <a
              href={handoff.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white px-3.5 py-2 text-[11px] font-semibold text-[#070708] transition-colors hover:bg-zinc-200"
            >
              <Instagram className="h-3 w-3" aria-hidden="true" />
              <span>Open Instagram DM</span>
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
