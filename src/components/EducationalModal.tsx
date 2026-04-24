import { useEffect } from 'react';
import { bugById } from '../game';
import { useGame } from '../context/GameContext';

export function EducationalModal() {
  const { modalQueue, dismissModal } = useGame();
  const current = modalQueue[0];

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        dismissModal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, dismissModal]);

  if (!current) return null;

  const bug = bugById(current.bugId);
  const remaining = modalQueue.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bug-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
      <div className="relative bg-slate-800 ring-1 ring-slate-700/80 rounded-xl shadow-2xl max-w-lg w-full p-6 md:p-7 animate-[fadeIn_120ms_ease-out]">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-amber-300 font-semibold">
              Bug Resolved · {current.resolvedBy === 'player' ? 'Your Agents' : 'Legacy Code'}
            </p>
            <h2 id="bug-modal-title" className="text-lg font-semibold text-slate-100 mt-1">
              {bug.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pattern · Size {bug.size} · Battleship analogue: {bug.classic}
            </p>
          </div>
          {remaining > 1 && (
            <span className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-700/60 px-2 py-1 rounded">
              {remaining - 1} more queued
            </span>
          )}
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{bug.description}</p>

        <div className="mt-6 flex items-center justify-end">
          <button
            type="button"
            onClick={dismissModal}
            className="px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-semibold"
            autoFocus
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
