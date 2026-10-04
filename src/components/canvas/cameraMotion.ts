/** Smoothstep has zero velocity at both ends of a camera flight. */
export function cameraProgress(elapsed: number, duration = 1.6): number {
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  return progress * progress * (3 - 2 * progress);
}
