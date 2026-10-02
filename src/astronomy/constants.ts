/**
 * 3D Solar System Simulator — Astronomical Constants
 */

/** One Astronomical Unit in kilometers (IAU 2012 definition) */
export const KM_PER_AU = 149597870.7;

/** Speed of light in kilometers per second */
export const SPEED_OF_LIGHT_KMS = 299792.458;

/** Speed of light in AU per second */
export const SPEED_OF_LIGHT_AU_SEC = SPEED_OF_LIGHT_KMS / KM_PER_AU; // ~2.0039888e-3 AU/s

/** Light travel time per AU in seconds (approx 499.00478 seconds = ~8.3167 minutes) */
export const LIGHT_SECONDS_PER_AU = KM_PER_AU / SPEED_OF_LIGHT_KMS;

/** J2000.0 Julian date in TT. The educational UTC calculation omits TT/TDB conversion. */
export const J2000_JD = 2451545.0;

/** Solar radius in kilometers */
export const SUN_RADIUS_KM = 696340;

/** Solar mass in kilograms */
export const SUN_MASS_KG = 1.9885e30;

/** Habitable Zone Boundaries (Astronomical Units) */
export const HABITABLE_ZONE = {
  conservativeInnerAU: 0.95,
  conservativeOuterAU: 1.37,
  optimisticInnerAU: 0.84,
  optimisticOuterAU: 1.67,
};

/**
 * Historical astronomical events to jump to
 */
export interface HistoricEvent {
  name: string;
  date: string; // ISO-8601
  description: string;
  focusBodyId: string;
}

export const HISTORIC_EVENTS: HistoricEvent[] = [
  {
    name: 'J2000 Standard Epoch',
    date: '2000-01-01T12:00:00Z',
    description: 'Astronomical standard coordinate reference epoch.',
    focusBodyId: 'earth',
  },
  {
    name: 'Apollo 11 Moon Landing',
    date: '1969-07-20T20:17:40Z',
    description: 'First humans land on the lunar surface (Sea of Tranquility).',
    focusBodyId: 'moon',
  },
  {
    name: 'Halley Perihelion 1986',
    date: '1986-02-09T00:00:00Z',
    description: 'NASA day-level perihelion date; local radial model calibrated to 0.587 AU. Orientation is illustrative.',
    focusBodyId: 'halley',
  },
  {
    name: 'Voyager 1 Pale Blue Dot',
    date: '1990-02-14T05:00:00Z',
    description: 'Voyager 1 takes the iconic portrait of Earth from 40 AU away.',
    focusBodyId: 'earth',
  },
  {
    name: 'New Horizons Pluto Flyby',
    date: '2015-07-14T11:49:57Z',
    description: 'First close-up reconnaissance of dwarf planet Pluto and Charon.',
    focusBodyId: 'pluto',
  },
  {
    name: 'Great Conjunction 2020',
    date: '2020-12-21T18:22:00Z',
    description: 'Jupiter and Saturn apparent closest visual approach in 800 years.',
    focusBodyId: 'jupiter',
  },
  {
    name: 'Halley 2061 Return (Approximate)',
    date: '2061-07-28T12:00:00Z',
    description: 'Expected return date is approximate. The fixed 1986 local model is extrapolated and cannot predict this return accurately.',
    focusBodyId: 'halley',
  },
];
