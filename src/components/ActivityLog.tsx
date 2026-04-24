import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

export function ActivityLog() {
  const { log } = useGame();
  const scroller = useRef<HTMLOListElement | null>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);

  return (
    <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700/60 shadow-lg shadow-black/30 p-4 md:p-5 flex flex-col h-full min-h-[16rem]">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-100">Activity Log</h3>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">live feed</span>
      </div>

      <ol
        ref={scroller}
        className="flex-1 overflow-y-auto pr-1 space-y-1.5 text-xs font-mono"
        aria-live="polite"
      >
        {log.map((entry) => {
          const sideColor =
            entry.side === 'player'
              ? 'text-sky-300'
              : entry.side === 'ai'
                ? 'text-rose-300'
                : 'text-slate-400';
          const kindColor =
            entry.kind === 'sink'
              ? 'text-amber-300'
              : entry.kind === 'phase'
                ? 'text-emerald-300'
                : 'text-slate-300';
          return (
            <li key={entry.id} className="flex gap-2 items-start">
              <span className={`shrink-0 ${sideColor}`}>
                {entry.side === 'player' ? '› you' : entry.side === 'ai' ? '› ai ' : '› sys'}
              </span>
              <span className={kindColor}>{entry.message}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
