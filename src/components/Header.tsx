import { useGame } from '../context/GameContext';

export function Header() {
  const { phase, currentTurn, winner, newGame, seed, setSeed } = useGame();

  const status =
    phase === 'setup'
      ? 'Setup · Deploying agents'
      : phase === 'game_over'
        ? winner === 'player'
          ? 'Resolved · You won'
          : 'Compromised · Legacy code wins'
        : currentTurn === 'player'
          ? 'Live · Your move'
          : 'Live · Legacy code is probing';

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 grid place-items-center text-slate-950 font-black">
          A
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-100">
            AgentShip <span className="text-slate-400 font-normal">— The Agentic Refactor</span>
          </h1>
          <p className="text-xs text-slate-400">Tech-debt remediation console · v0.1</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={[
            'text-[10px] uppercase tracking-widest px-2 py-1 rounded ring-1',
            phase === 'playing' && currentTurn === 'player'
              ? 'bg-sky-500/10 ring-sky-400/40 text-sky-300'
              : phase === 'playing'
                ? 'bg-rose-500/10 ring-rose-400/40 text-rose-300'
                : phase === 'game_over'
                  ? 'bg-amber-500/10 ring-amber-400/40 text-amber-300'
                  : 'bg-slate-700/40 ring-slate-600/40 text-slate-300',
          ].join(' ')}
        >
          {status}
        </span>

        <label className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          seed
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value) || 0)}
            disabled={phase !== 'setup'}
            className="bg-slate-800 ring-1 ring-slate-700 rounded px-2 py-1 w-20 text-xs text-slate-200 disabled:opacity-50 font-mono"
          />
        </label>

        <button
          type="button"
          onClick={() => newGame()}
          className="text-xs px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 ring-1 ring-slate-700 text-slate-200"
        >
          New incident
        </button>
      </div>
    </header>
  );
}
