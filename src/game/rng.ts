/**
 * Deterministic, seedable pseudo-random number generator (mulberry32).
 *
 * All randomness in the game flows through one of these so that placements
 * and AI decisions can be reproduced exactly under unit tests.
 */
export interface RNG {
  /** Returns a float in [0, 1). */
  next(): number;
  /** Returns an integer in [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
  /** Fisher-Yates shuffle that returns a new array. */
  shuffle<T>(input: readonly T[]): T[];
}

export function createRNG(seed: number): RNG {
  let state = seed >>> 0;
  if (state === 0) state = 0x9e3779b9;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const nextInt = (maxExclusive: number): number => {
    if (maxExclusive <= 0) return 0;
    return Math.floor(next() * maxExclusive);
  };

  const shuffle = <T,>(input: readonly T[]): T[] => {
    const arr = input.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = nextInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  return { next, nextInt, shuffle };
}
