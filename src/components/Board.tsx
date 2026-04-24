import { useMemo, useState } from 'react';
import {
  BOARD_SIZE,
  cellsForPlacement,
  coordKey,
  isValidPlacement,
  type BoardState,
  type BugPlacement,
  type Coord,
  type ShotResult,
} from '../game';
import { useGame } from '../context/GameContext';

interface BoardProps {
  board: BoardState;
  /** Whether to render bug placements (true for player board, false for AI). */
  showPlacements: boolean;
  /** Click handler for a cell. */
  onCellClick?: (coord: Coord) => void;
  /** Disable all input. */
  disabled?: boolean;
  /** Show placement preview overlay (setup phase, player board only). */
  placementPreview?: boolean;
  title: string;
  subtitle: string;
}

const COL_LABELS = Array.from({ length: BOARD_SIZE }, (_, i) => String.fromCharCode(65 + i));

export function Board({
  board,
  showPlacements,
  onCellClick,
  disabled = false,
  placementPreview = false,
  title,
  subtitle,
}: BoardProps) {
  const { selectedBugId, setupOrientation, playerBoard } = useGame();
  const [hover, setHover] = useState<Coord | null>(null);

  const placementCells = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    if (!showPlacements) return set;
    for (const p of board.placements) {
      for (const c of cellsForPlacement(p)) set.add(coordKey(c));
    }
    return set;
  }, [board.placements, showPlacements]);

  // Compute preview cells for the active bug placement.
  const preview = useMemo<{ cells: Set<string>; valid: boolean } | null>(() => {
    if (!placementPreview || !hover || !selectedBugId) return null;
    const placement: BugPlacement = {
      bugId: selectedBugId,
      origin: hover,
      orientation: setupOrientation,
    };
    const cells = cellsForPlacement(placement);
    const set = new Set(cells.map(coordKey));
    const existing = playerBoard.placements.filter((p) => p.bugId !== selectedBugId);
    const valid = isValidPlacement(placement, existing);
    return { cells: set, valid };
  }, [hover, placementPreview, selectedBugId, setupOrientation, playerBoard.placements]);

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg shadow-black/40 ring-1 ring-slate-700/60 p-4 md:p-6 flex flex-col">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-100">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-[1.25rem_repeat(10,minmax(0,1fr))] gap-1 text-[10px] text-slate-500 select-none">
        <div />
        {COL_LABELS.map((l) => (
          <div key={l} className="text-center font-mono">{l}</div>
        ))}
        {Array.from({ length: BOARD_SIZE }).map((_, row) => (
          <BoardRow
            key={row}
            row={row}
            board={board}
            placementCells={placementCells}
            preview={preview}
            onCellClick={onCellClick}
            disabled={disabled}
            placementPreview={placementPreview}
            onHover={setHover}
            showPlacements={showPlacements}
          />
        ))}
      </div>
    </div>
  );
}

interface BoardRowProps {
  row: number;
  board: BoardState;
  placementCells: Set<string>;
  preview: { cells: Set<string>; valid: boolean } | null;
  onCellClick?: (coord: Coord) => void;
  disabled: boolean;
  placementPreview: boolean;
  onHover: (c: Coord | null) => void;
  showPlacements: boolean;
}

function BoardRow({
  row,
  board,
  placementCells,
  preview,
  onCellClick,
  disabled,
  placementPreview,
  onHover,
  showPlacements,
}: BoardRowProps) {
  return (
    <>
      <div className="flex items-center justify-end pr-1 font-mono">{row + 1}</div>
      {Array.from({ length: BOARD_SIZE }).map((_, col) => {
        const coord = { row, col };
        const key = coordKey(coord);
        const shot = board.shots[key];
        const hasPlacement = placementCells.has(key);
        const inPreview = preview?.cells.has(key) ?? false;
        return (
          <Cell
            key={col}
            coord={coord}
            shot={shot}
            hasPlacement={hasPlacement}
            inPreview={inPreview}
            previewValid={preview?.valid ?? true}
            disabled={disabled}
            placementPreview={placementPreview}
            showPlacements={showPlacements}
            onClick={onCellClick}
            onHover={onHover}
          />
        );
      })}
    </>
  );
}

interface CellProps {
  coord: Coord;
  shot: ShotResult | undefined;
  hasPlacement: boolean;
  inPreview: boolean;
  previewValid: boolean;
  disabled: boolean;
  placementPreview: boolean;
  showPlacements: boolean;
  onClick?: (c: Coord) => void;
  onHover: (c: Coord | null) => void;
}

function Cell({
  coord,
  shot,
  hasPlacement,
  inPreview,
  previewValid,
  disabled,
  placementPreview,
  showPlacements,
  onClick,
  onHover,
}: CellProps) {
  const interactive = !disabled && !!onClick;

  let cls = 'aspect-square rounded-md transition-colors duration-150 ease-out flex items-center justify-center text-[9px] font-mono ';
  // Base.
  cls += 'bg-slate-700/80 ';

  if (hasPlacement && showPlacements && !shot) {
    cls += 'bg-slate-500/80 ring-1 ring-slate-300/30 ';
  }

  // Shot overlays trump base / placement.
  if (shot === 'miss') {
    cls = cls.replace('bg-slate-700/80', '').replace('bg-slate-500/80 ring-1 ring-slate-300/30', '');
    cls += 'bg-sky-500/30 text-sky-200 shadow-glow-blue ring-1 ring-sky-400/60 ';
  } else if (shot === 'hit') {
    cls = cls.replace('bg-slate-700/80', '').replace('bg-slate-500/80 ring-1 ring-slate-300/30', '');
    cls += 'bg-amber-500/80 text-amber-100 shadow-glow-amber ring-1 ring-amber-300 ';
  } else if (shot === 'sunk') {
    cls = cls.replace('bg-slate-700/80', '').replace('bg-slate-500/80 ring-1 ring-slate-300/30', '');
    cls += 'bg-red-600 text-red-100 shadow-glow-red ring-2 ring-red-300 ';
  }

  // Preview overlay during setup.
  if (inPreview && placementPreview && !shot) {
    cls += previewValid
      ? 'outline outline-2 outline-emerald-400/80 '
      : 'outline outline-2 outline-rose-500/80 ';
  }

  if (interactive && !shot) {
    cls += 'cursor-pointer hover:bg-slate-600 hover:animate-cellPulse ';
  } else if (!interactive) {
    cls += 'cursor-default ';
  } else {
    cls += 'cursor-not-allowed ';
  }

  return (
    <button
      type="button"
      aria-label={`Cell ${String.fromCharCode(65 + coord.col)}${coord.row + 1}`}
      className={cls.trim()}
      disabled={!interactive || !!shot}
      onMouseEnter={() => onHover(coord)}
      onMouseLeave={() => onHover(null)}
      onClick={() => interactive && !shot && onClick && onClick(coord)}
    >
      {shot === 'miss' ? '·' : shot === 'hit' ? '!' : shot === 'sunk' ? '✕' : ''}
    </button>
  );
}
