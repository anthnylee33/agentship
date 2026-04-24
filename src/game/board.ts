import {
  BOARD_SIZE,
  BUG_TYPES,
  type BoardState,
  type BugPlacement,
  type BugType,
  type BugTypeId,
  type Coord,
  type Orientation,
  type ShotResult,
} from './types';
import type { RNG } from './rng';

export const coordKey = (c: Coord): string => `${c.row},${c.col}`;

export const inBounds = (c: Coord): boolean =>
  c.row >= 0 && c.row < BOARD_SIZE && c.col >= 0 && c.col < BOARD_SIZE;

export function bugById(id: BugTypeId): BugType {
  const bug = BUG_TYPES.find((b) => b.id === id);
  if (!bug) throw new Error(`Unknown bug id: ${id}`);
  return bug;
}

/** Cells that a placement occupies. */
export function cellsForPlacement(p: BugPlacement): Coord[] {
  const size = bugById(p.bugId).size;
  const cells: Coord[] = [];
  for (let i = 0; i < size; i++) {
    cells.push(
      p.orientation === 'horizontal'
        ? { row: p.origin.row, col: p.origin.col + i }
        : { row: p.origin.row + i, col: p.origin.col },
    );
  }
  return cells;
}

/** Validates that a placement is in-bounds and does not overlap existing placements. */
export function isValidPlacement(
  placement: BugPlacement,
  existing: readonly BugPlacement[],
): boolean {
  const cells = cellsForPlacement(placement);
  if (!cells.every(inBounds)) return false;
  const occupied = new Set<string>();
  for (const ex of existing) {
    if (ex.bugId === placement.bugId) continue;
    for (const c of cellsForPlacement(ex)) occupied.add(coordKey(c));
  }
  return cells.every((c) => !occupied.has(coordKey(c)));
}

export function emptyBoard(): BoardState {
  return { placements: [], shots: {}, resolvedBugs: [] };
}

/** Auto-place every bug type on a board using the provided RNG. */
export function autoPlaceAll(rng: RNG): BugPlacement[] {
  const placements: BugPlacement[] = [];
  for (const bug of BUG_TYPES) {
    let placed = false;
    for (let attempt = 0; attempt < 500 && !placed; attempt++) {
      const orientation: Orientation =
        rng.nextInt(2) === 0 ? 'horizontal' : 'vertical';
      const maxRow = orientation === 'vertical' ? BOARD_SIZE - bug.size : BOARD_SIZE - 1;
      const maxCol = orientation === 'horizontal' ? BOARD_SIZE - bug.size : BOARD_SIZE - 1;
      const origin: Coord = {
        row: rng.nextInt(maxRow + 1),
        col: rng.nextInt(maxCol + 1),
      };
      const candidate: BugPlacement = { bugId: bug.id, origin, orientation };
      if (isValidPlacement(candidate, placements)) {
        placements.push(candidate);
        placed = true;
      }
    }
    if (!placed) {
      throw new Error(`Auto-placement failed for ${bug.name}`);
    }
  }
  return placements;
}

/** Returns the placement that occupies a given cell, if any. */
export function placementAt(
  board: BoardState,
  coord: Coord,
): BugPlacement | undefined {
  return board.placements.find((p) =>
    cellsForPlacement(p).some((c) => c.row === coord.row && c.col === coord.col),
  );
}

/** Pure shot resolution. Returns the next board state and the shot's result. */
export function resolveShot(
  board: BoardState,
  coord: Coord,
): { board: BoardState; result: ShotResult; bugId?: BugTypeId } {
  const key = coordKey(coord);
  if (board.shots[key]) {
    return { board, result: board.shots[key], bugId: placementAt(board, coord)?.bugId };
  }
  const placement = placementAt(board, coord);
  if (!placement) {
    return {
      board: { ...board, shots: { ...board.shots, [key]: 'miss' } },
      result: 'miss',
    };
  }

  const cells = cellsForPlacement(placement);
  const sunk = cells.every((c) => {
    if (c.row === coord.row && c.col === coord.col) return true;
    const v = board.shots[coordKey(c)];
    return v === 'hit' || v === 'sunk';
  });

  if (!sunk) {
    return {
      board: { ...board, shots: { ...board.shots, [key]: 'hit' } },
      result: 'hit',
      bugId: placement.bugId,
    };
  }

  // Sunk: mark every cell of the placement as 'sunk'.
  const shots: Record<string, ShotResult> = { ...board.shots };
  for (const c of cells) shots[coordKey(c)] = 'sunk';
  return {
    board: {
      ...board,
      shots,
      resolvedBugs: board.resolvedBugs.includes(placement.bugId)
        ? board.resolvedBugs
        : [...board.resolvedBugs, placement.bugId],
    },
    result: 'sunk',
    bugId: placement.bugId,
  };
}

/** True iff every placement on the board has been fully resolved. */
export function allBugsResolved(board: BoardState): boolean {
  if (board.placements.length === 0) return false;
  return board.placements.every((p) =>
    cellsForPlacement(p).every((c) => {
      const v = board.shots[coordKey(c)];
      return v === 'hit' || v === 'sunk';
    }),
  );
}

/**
 * Classic-rules turn continuation: a hit (including a sunk hit) keeps the
 * turn; a miss ends the turn.
 */
export function shouldContinueTurn(result: ShotResult): boolean {
  return result === 'hit' || result === 'sunk';
}
