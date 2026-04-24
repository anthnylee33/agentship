import { BUG_TYPES, type BugTypeId } from '../game';
import { useGame } from '../context/GameContext';

export function SetupPanel() {
  const {
    playerBoard,
    selectedBugId,
    setupOrientation,
    selectBug,
    toggleOrientation,
    autoPlacePlayer,
    resetPlacements,
    startGame,
  } = useGame();

  const placedIds = new Set(playerBoard.placements.map((p) => p.bugId));
  const allPlaced = placedIds.size === BUG_TYPES.length;

  return (
    <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700/60 shadow-lg shadow-black/30 p-4 md:p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-100 tracking-tight">Deploy Agents</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Position autonomous agents on your architecture map. Each represents a bug class to defend.
        </p>
      </div>

      <ul className="flex flex-col gap-1.5">
        {BUG_TYPES.map((b) => {
          const placed = placedIds.has(b.id);
          const selected = selectedBugId === b.id;
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => selectBug(b.id as BugTypeId)}
                className={[
                  'w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors ring-1',
                  selected
                    ? 'bg-sky-500/10 ring-sky-400/50 text-slate-100'
                    : placed
                      ? 'bg-slate-700/40 ring-slate-600/40 text-slate-300'
                      : 'bg-slate-700/60 ring-slate-600/40 text-slate-200 hover:bg-slate-700',
                ].join(' ')}
              >
                <span className="flex flex-col">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-[10px] text-slate-400">size {b.size}</span>
                </span>
                <span className={[
                  'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded',
                  placed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600/60 text-slate-300',
                ].join(' ')}>
                  {placed ? 'placed' : 'pending'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>Orientation</span>
        <button
          type="button"
          onClick={toggleOrientation}
          className="px-3 py-1 rounded-md bg-slate-700 hover:bg-slate-600 ring-1 ring-slate-600 text-slate-100 capitalize"
        >
          {setupOrientation}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={autoPlacePlayer}
          className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 ring-1 ring-slate-600 text-sm text-slate-100"
        >
          Auto-place
        </button>
        <button
          type="button"
          onClick={resetPlacements}
          className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 ring-1 ring-slate-600 text-sm text-slate-200"
        >
          Reset placements
        </button>
        <button
          type="button"
          disabled={!allPlaced}
          onClick={startGame}
          className={[
            'px-3 py-2 rounded-md text-sm font-semibold transition-colors',
            allPlaced
              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed',
          ].join(' ')}
        >
          {allPlaced ? 'Begin AgentShip' : `Place ${BUG_TYPES.length - placedIds.size} more`}
        </button>
      </div>
    </div>
  );
}
