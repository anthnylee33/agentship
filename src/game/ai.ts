import { BOARD_SIZE, type AITargetingMemory, type BoardState, type Coord, type ShotResult } from './types';
import { coordKey, inBounds } from './board';
import type { RNG } from './rng';

export const emptyAIMemory = (): AITargetingMemory => ({ queue: [], activeHits: [] });

const orthogonalNeighbors = (c: Coord): Coord[] => [
  { row: c.row - 1, col: c.col },
  { row: c.row + 1, col: c.col },
  { row: c.row, col: c.col - 1 },
  { row: c.row, col: c.col + 1 },
];

const isUnshot = (board: BoardState, c: Coord): boolean =>
  inBounds(c) && board.shots[coordKey(c)] === undefined;

const sameRow = (a: Coord, b: Coord) => a.row === b.row;
const sameCol = (a: Coord, b: Coord) => a.col === b.col;

/**
 * Select the next AI shot.
 *
 * Strategy:
 * - If there are queued targets from a recent hit, fire at the next queued
 *   in-bounds, unshot cell.
 * - Otherwise, fire at a random unshot cell.
 *
 * The function only inspects state — it never mutates the board or memory.
 */
export function pickAIShot(
  board: BoardState,
  memory: AITargetingMemory,
  rng: RNG,
): Coord {
  // Prefer the queue.
  for (const c of memory.queue) {
    if (isUnshot(board, c)) return c;
  }

  // Fall back to a random unshot cell.
  const candidates: Coord[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board.shots[coordKey({ row: r, col: c })] === undefined) {
        candidates.push({ row: r, col: c });
      }
    }
  }
  if (candidates.length === 0) {
    throw new Error('No cells remaining for AI to shoot.');
  }
  return candidates[rng.nextInt(candidates.length)];
}

/**
 * Update the AI's targeting memory after a shot was resolved.
 *
 * - On a miss: drop the cell from the queue if it was there.
 * - On a hit: prune queue and prefer cells aligned with the running streak.
 *   When two or more hits share a row/column, only that axis remains worth
 *   pursuing — orthogonal candidates are dropped.
 * - On a sunk: clear active hits and queue.
 */
export function updateAIMemory(
  memory: AITargetingMemory,
  shotAt: Coord,
  result: ShotResult,
  board: BoardState,
): AITargetingMemory {
  const removeShot = (queue: Coord[]) =>
    queue.filter((c) => !(c.row === shotAt.row && c.col === shotAt.col));

  if (result === 'miss') {
    return { queue: removeShot(memory.queue), activeHits: memory.activeHits };
  }

  if (result === 'sunk') {
    return { queue: [], activeHits: [] };
  }

  // Plain hit: extend the queue with orthogonal neighbors that are still unshot.
  const activeHits = [...memory.activeHits, shotAt];
  let queue = removeShot(memory.queue);

  const newNeighbors = orthogonalNeighbors(shotAt).filter((c) => isUnshot(board, c));
  for (const n of newNeighbors) {
    if (!queue.some((q) => q.row === n.row && q.col === n.col)) queue.push(n);
  }

  // If we have two or more hits in a line, prune queue to that axis.
  if (activeHits.length >= 2) {
    const allSameRow = activeHits.every((h) => sameRow(h, activeHits[0]));
    const allSameCol = activeHits.every((h) => sameCol(h, activeHits[0]));
    if (allSameRow) {
      queue = queue.filter((c) => c.row === activeHits[0].row);
    } else if (allSameCol) {
      queue = queue.filter((c) => c.col === activeHits[0].col);
    }
  }

  return { queue, activeHits };
}
