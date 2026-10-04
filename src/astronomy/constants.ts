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
  sourceUrl?: string;
  eclipseType?: 'solar' | 'lunar';
  annular?: boolean;
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
  {
    name: 'Voyager 1 Jupiter Flyby', date: '1979-03-05T12:00:00Z', focusBodyId: 'jupiter',
    description: 'Voyager 1 encounters Jupiter. Day-level bookmark; spacecraft trajectory is not simulated.',
    sourceUrl: 'https://science.nasa.gov/mission/voyager/planetary-voyage/',
  },
  {
    name: 'Voyager 2 Uranus Flyby', date: '1986-01-24T12:00:00Z', focusBodyId: 'uranus',
    description: 'The first spacecraft encounter with Uranus. Day-level bookmark; spacecraft trajectory is not simulated.',
    sourceUrl: 'https://science.nasa.gov/mission/voyager/voyager-2/',
  },
  {
    name: 'Voyager 2 Neptune Flyby', date: '1989-08-25T12:00:00Z', focusBodyId: 'neptune',
    description: 'Voyager 2 visits Neptune and Triton. Day-level bookmark; spacecraft trajectory is not simulated.',
    sourceUrl: 'https://science.nasa.gov/mission/voyager/voyager-2/',
  },
  {
    name: 'Cassini Grand Finale', date: '2017-09-15T12:00:00Z', focusBodyId: 'saturn',
    description: 'Cassini ends its mission at Saturn. Day-level bookmark; spacecraft trajectory is not simulated.',
    sourceUrl: 'https://science.nasa.gov/mission/cassini/grand-finale/overview/',
  },
  {
    name: 'Annular Solar Eclipse 2023', date: '2023-10-14T12:00:00Z', focusBodyId: 'earth',
    description: 'An annular eclipse crosses the Americas. Open the interactive ring-of-fire illustration.',
    eclipseType: 'solar', annular: true, sourceUrl: 'https://eclipse.gsfc.nasa.gov/SEdecade/SEdecade2021.html',
  },
  {
    name: 'Total Solar Eclipse 2024', date: '2024-04-08T12:00:00Z', focusBodyId: 'earth',
    description: 'Totality crosses Mexico, the United States, and Canada. Open the interactive solar eclipse illustration.',
    eclipseType: 'solar', sourceUrl: 'https://science.nasa.gov/eclipses/future-eclipses/eclipse-2024/',
  },
  {
    name: 'Total Solar Eclipse 2026', date: '2026-08-12T12:00:00Z', focusBodyId: 'earth',
    description: 'Totality crosses Greenland, Iceland, and Spain. Visibility depends on location.',
    eclipseType: 'solar', sourceUrl: 'https://eclipse.gsfc.nasa.gov/SEdecade/SEdecade2021.html',
  },
  {
    name: 'Total Solar Eclipse 2027', date: '2027-08-02T12:00:00Z', focusBodyId: 'earth',
    description: 'Totality crosses parts of southern Europe, North Africa, and the Middle East.',
    eclipseType: 'solar', sourceUrl: 'https://eclipse.gsfc.nasa.gov/SEdecade/SEdecade2021.html',
  },
  {
    name: 'Total Lunar Eclipse 2022', date: '2022-11-08T12:00:00Z', focusBodyId: 'moon',
    description: 'Earth’s shadow crosses the Moon; visible in parts of Asia, Australia, the Pacific, and the Americas.',
    eclipseType: 'lunar', sourceUrl: 'https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html',
  },
  {
    name: 'Total Lunar Eclipse 2025 — March', date: '2025-03-14T12:00:00Z', focusBodyId: 'moon',
    description: 'A total lunar eclipse is visible in parts of the Pacific, Americas, western Europe, and western Africa.',
    eclipseType: 'lunar', sourceUrl: 'https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html',
  },
  {
    name: 'Total Lunar Eclipse 2025 — September', date: '2025-09-07T12:00:00Z', focusBodyId: 'moon',
    description: 'A total lunar eclipse is visible in parts of Europe, Africa, Asia, and Australia.',
    eclipseType: 'lunar', sourceUrl: 'https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html',
  },
  {
    name: 'Total Lunar Eclipse 2026', date: '2026-03-03T12:00:00Z', focusBodyId: 'moon',
    description: 'A total lunar eclipse is visible in parts of eastern Asia, Australia, the Pacific, and the Americas.',
    eclipseType: 'lunar', sourceUrl: 'https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html',
  },
];
