import { useState } from 'react';
import { Board } from './components/Board';
import { SetupPanel } from './components/SetupPanel';
import { ActivityLog } from './components/ActivityLog';
import { EducationalModal } from './components/EducationalModal';
import { Header } from './components/Header';
import { WelcomeModal } from './components/WelcomeModal';
import { GameProvider, useGame } from './context/GameContext';
import type { Coord } from './game';

function GameSurface({ onShowHelp }: { onShowHelp: () => void }) {
  const {
    phase,
    playerBoard,
    aiBoard,
    inputEnabledForPlayer,
    placeBug,
    playerShoot,
    currentTurn,
    selectedBugId,
  } = useGame();

  const handlePlayerCellClick = (c: Coord) => {
    if (phase === 'setup' && selectedBugId) {
      placeBug(c);
    }
  };

  const handleAICellClick = (c: Coord) => {
    if (phase === 'playing' && inputEnabledForPlayer) {
      playerShoot(c);
    }
  };

  const aiBoardDisabled = phase !== 'playing' || !inputEnabledForPlayer;

  const playerSubtitle =
    phase === 'setup'
      ? selectedBugId
        ? 'Click a starting cell to deploy the selected agent.'
        : 'All agents deployed. Begin the bash when ready.'
      : currentTurn === 'ai' && phase === 'playing'
        ? 'Legacy code is probing your services…'
        : 'Production environment · monitor for incoming probes';

  const aiSubtitle =
    phase === 'setup'
      ? 'Locked until agents are deployed.'
      : aiBoardDisabled
        ? 'Awaiting your turn…'
        : 'Click a cell to dispatch a scan.';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        <Header onShowHelp={onShowHelp} />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_18rem] gap-4 md:gap-6">
          <Board
            title="Your Architecture"
            subtitle={playerSubtitle}
            board={playerBoard}
            showPlacements
            placementPreview={phase === 'setup'}
            onCellClick={phase === 'setup' ? handlePlayerCellClick : undefined}
            disabled={phase !== 'setup'}
          />

          <Board
            title="Target System"
            subtitle={aiSubtitle}
            board={aiBoard}
            showPlacements={false}
            onCellClick={phase === 'playing' ? handleAICellClick : undefined}
            disabled={aiBoardDisabled}
          />

          <div className="flex flex-col gap-4 md:gap-6">
            {phase === 'setup' ? <SetupPanel /> : <PlayingSidebar />}
            <ActivityLog />
          </div>
        </div>

        <EducationalModal />
      </div>
    </div>
  );
}

function PlayingSidebar() {
  const { phase, winner, newGame, playerBoard, aiBoard } = useGame();

  const playerRemaining = playerBoard.placements.length - playerBoard.resolvedBugs.length;
  const aiRemaining = aiBoard.placements.length - aiBoard.resolvedBugs.length;

  return (
    <div className="bg-slate-800 ring-1 ring-slate-700/60 rounded-xl p-4 md:p-5 shadow-lg shadow-black/30 flex flex-col gap-3">
      <h3 className="text-sm font-semibold tracking-tight text-slate-100">Mission Status</h3>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <Stat label="Your bugs left" value={playerRemaining} tone="rose" />
        <Stat label="Target bugs left" value={aiRemaining} tone="sky" />
      </div>

      {phase === 'game_over' && (
        <div className="rounded-lg ring-1 ring-amber-400/30 bg-amber-500/5 p-3 text-xs">
          <p className="font-semibold text-amber-300 mb-1">
            {winner === 'player' ? 'All bugs resolved.' : 'Legacy code prevailed.'}
          </p>
          <p className="text-slate-300">
            {winner === 'player'
              ? 'Your agents cleared the technical debt before production was overrun.'
              : 'Your services are saturated. Spin up a new incident to try again.'}
          </p>
          <button
            type="button"
            onClick={() => newGame()}
            className="mt-3 px-3 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold"
          >
            New incident
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'sky' | 'rose' }) {
  const toneCls = tone === 'sky' ? 'text-sky-300' : 'text-rose-300';
  return (
    <div className="bg-slate-900/60 ring-1 ring-slate-700/60 rounded-lg p-3">
      <div className={`font-mono text-xl ${toneCls}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">{label}</div>
    </div>
  );
}

export default function App() {
  const [welcomeOpen, setWelcomeOpen] = useState<boolean>(true);

  return (
    <GameProvider>
      <GameSurface onShowHelp={() => setWelcomeOpen(true)} />
      <WelcomeModal open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
    </GameProvider>
  );
}
