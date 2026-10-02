/** Navigation limits are a visualization policy, not an ephemeris accuracy guarantee. */
export const SIMULATION_MIN_DATE = new Date('1800-01-01T00:00:00.000Z');
export const SIMULATION_MAX_DATE = new Date('2100-12-31T23:59:59.999Z');
export const SIMULATION_DATE_RANGE_LABEL = '1800–2100 UTC';

export function validateSimulationDate(date: Date): string | null {
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) return 'Enter a valid UTC date.';
  if (timestamp < SIMULATION_MIN_DATE.getTime() || timestamp > SIMULATION_MAX_DATE.getTime()) {
    return `Choose a date within ${SIMULATION_DATE_RANGE_LABEL}. Positions remain approximate.`;
  }
  return null;
}

/** Playback and stepping stop at a boundary instead of producing unsupported dates. */
export function clampSimulationDate(date: Date): Date {
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) throw new RangeError('Cannot advance to an invalid date.');
  return new Date(Math.max(SIMULATION_MIN_DATE.getTime(), Math.min(SIMULATION_MAX_DATE.getTime(), timestamp)));
}
