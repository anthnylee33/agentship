import { useEffect, useRef } from 'react';
import type { Side } from '../game';

interface EndGameModalProps {
  open: boolean;
  winner: Side | null;
  playerRemaining: number;
  aiRemaining: number;
  onNewGame: () => void;
  onClose: () => void;
}

export function EndGameModal({
  open,
  winner,
  playerRemaining,
  aiRemaining,
  onNewGame,
  onClose,
}: EndGameModalProps) {
  const ctaRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    ctaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !winner) return null;

  const isVictory = winner === 'player';

  const eyebrow = isVictory ? 'Victory' : 'Mission failed';
  const title = isVictory ? 'All bugs resolved.' : 'Legacy code prevailed.';
  const subtitle = isVictory
    ? 'Your autonomous agents cleared the entire target system before production was overrun.'
    : 'Your services were saturated before you could resolve the legacy code\u2019s bugs.';

  const eyebrowTone = isVictory ? 'text-emerald-300' : 'text-rose-300';
  const ringTone = isVictory ? 'ring-emerald-400/30' : 'ring-rose-400/30';
  const glowTone = isVictory
    ? 'shadow-[0_0_60px_rgba(16,185,129,0.25)]'
    : 'shadow-[0_0_60px_rgba(244,63,94,0.25)]';
  const ctaTone = isVictory
    ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
    : 'bg-sky-500 hover:bg-sky-400 text-slate-950';
  const badge = isVictory ? '\u2713' : '\u2717';
  const badgeTone = isVictory
    ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'
    : 'bg-rose-500/15 text-rose-300 ring-rose-400/30';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="endgame-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md" onClick={onClose} />
      <div
        className={`relative bg-slate-800 ring-1 ${ringTone} rounded-xl ${glowTone} max-w-md w-full p-6 md:p-8 animate-[fadeIn_140ms_ease-out]`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-100 text-lg leading-none w-7 h-7 grid place-items-center rounded-md hover:bg-slate-700/60"
        >
          ×
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 grid place-items-center rounded-full ring-1 ${badgeTone} text-lg font-semibold`}
            aria-hidden
          >
            {badge}
          </div>
          <div className="flex-1">
            <p className={`text-[10px] tracking-widest uppercase font-semibold ${eyebrowTone}`}>
              {eyebrow}
            </p>
            <h2 id="endgame-title" className="text-xl md:text-2xl font-semibold text-slate-100 mt-1">
              {title}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">{subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <Stat label="Bugs left on Target System" value={aiRemaining} tone={isVictory ? 'emerald' : 'sky'} />
          <Stat label="Bugs left on Your Architecture" value={playerRemaining} tone={isVictory ? 'sky' : 'rose'} />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-md text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-700/60"
          >
            Review the board
          </button>
          <button
            ref={ctaRef}
            type="button"
            onClick={onNewGame}
            className={`px-4 py-2 rounded-md text-sm font-semibold ${ctaTone}`}
          >
            New incident
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'emerald' | 'sky' | 'rose';
}) {
  const toneCls =
    tone === 'emerald' ? 'text-emerald-300' : tone === 'sky' ? 'text-sky-300' : 'text-rose-300';
  return (
    <div className="bg-slate-900/60 ring-1 ring-slate-700/60 rounded-lg p-3">
      <div className={`font-mono text-xl ${toneCls}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">{label}</div>
    </div>
  );
}
