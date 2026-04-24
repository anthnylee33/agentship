import { useEffect, useRef } from 'react';
import { BUG_TYPES } from '../game';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-slate-800 ring-1 ring-slate-700/80 rounded-xl shadow-2xl max-w-2xl w-full p-6 md:p-8 max-h-[88vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-sky-300 font-semibold">
              Welcome to AgentShip
            </p>
            <h2 id="welcome-title" className="text-xl md:text-2xl font-semibold text-slate-100 mt-1">
              How to play
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              A two-board duel against legacy code. You deploy autonomous agents to clear
              technical debt before the legacy stack overruns your services.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg leading-none px-2 py-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <Section title="The boards">
          <ul className="list-disc list-inside space-y-1">
            <li>
              <span className="text-slate-100">Your Architecture</span> (left): your agents are
              deployed here. The AI attacks this board.
            </li>
            <li>
              <span className="text-slate-100">Target System</span> (right): the legacy code's bug
              placements are hidden. You attack this board.
            </li>
          </ul>
        </Section>

        <Section title="Setup">
          <ol className="list-decimal list-inside space-y-1">
            <li>Pick a bug from the right sidebar.</li>
            <li>
              Toggle <span className="text-slate-100">Horizontal</span> /{' '}
              <span className="text-slate-100">Vertical</span> orientation.
            </li>
            <li>Click a starting cell on Your Architecture to deploy that bug.</li>
            <li>
              Or click <span className="text-slate-100">Auto-place</span> to scatter all five for
              you. <span className="text-slate-100">Reset placements</span> clears the board.
            </li>
            <li>
              When all five are placed, hit <span className="text-slate-100">Begin AgentShip</span>.
            </li>
          </ol>
        </Section>

        <Section title="Turn rules (classic Battleship)">
          <ul className="list-disc list-inside space-y-1">
            <li>You go first. Click any cell on Target System to dispatch a scan.</li>
            <li>
              <span className="text-amber-300">Bug Identified</span> (hit) — you keep your turn and
              shoot again.
            </li>
            <li>
              <span className="text-sky-300">Code Clean</span> (miss) — turn passes to the legacy
              code.
            </li>
            <li>
              <span className="text-red-300">Bug Resolved</span> (sunk) — every cell of that bug
              flips, an educational modal pops up, and you keep shooting once it's dismissed.
            </li>
          </ul>
        </Section>

        <Section title="Win condition">
          <p>
            Resolve every bug on Target System before the legacy code resolves all of yours. The
            educational modals are <span className="text-slate-100">blocking</span>: whoever sunk
            the bug can't take their next shot until the modal is acknowledged.
          </p>
        </Section>

        <Section title="The bug catalogue">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            {BUG_TYPES.map((b) => (
              <li key={b.id} className="flex items-baseline justify-between gap-3">
                <span className="text-slate-100">{b.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  {b.classic} · size {b.size}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <p className="text-xs text-slate-500 mt-6">
          Tip: you can re-open this guide any time via the <span className="text-slate-300">?</span>{' '}
          button in the header.
        </p>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-semibold"
          >
            Got it — let's play
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
        {title}
      </h3>
      <div className="text-sm text-slate-300 leading-relaxed">{children}</div>
    </section>
  );
}
