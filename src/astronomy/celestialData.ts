/**
 * Educational catalog with explicit record-level orbital provenance.
 * Legacy values remain illustrative unless independently sourced below.
 */

import { CelestialBody } from './types';
import { J2000_JD } from './constants';
import { enrichCatalog } from './scienceCatalog';

export const CELESTIAL_BODIES: CelestialBody[] = [
  // ==================== SUN ====================
  {
    id: 'sun',
    name: 'Sun',
    type: 'star',
    physical: {
      radiusKm: 696340,
      massKg: 1.9885e30,
      gravityMs2: 274.0,
      densityGcm3: 1.408,
      escapeVelocityKms: 617.7,
      rotationPeriodHours: 609.12, // 25.38 Earth days at equator
      axialTiltDeg: 7.25,
      meanTempC: 5505, // Surface photosphere
      atmosphere: ['Hydrogen (73.4%)', 'Helium (25.0%)', 'Oxygen (0.8%)', 'Carbon (0.3%)'],
      color: '#fbbf24',
      overview: 'Yellow dwarf star at the center of the Solar System. Contains 99.86% of the system\'s total mass.',
      funFact: 'About 1.3 million Earths could fit inside the Sun. Its core fuses 600 million tons of hydrogen into helium every second.',
    },
    textureType: 'sun',
  },

  // ==================== PLANETS ====================
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'planet',
    orbitalElements: {
      a: 0.387098,
      e: 0.205630,
      i: 7.005,
      om: 48.331,
      w: 29.124,
      ma0: 174.796,
      periodDays: 87.969,
    },
    physical: {
      radiusKm: 2439.7,
      massKg: 3.3011e23,
      gravityMs2: 3.7,
      densityGcm3: 5.427,
      escapeVelocityKms: 4.25,
      rotationPeriodHours: 1407.6, // 58.64 days (3:2 spin-orbit resonance)
      axialTiltDeg: 0.034,
      meanTempC: 167,
      atmosphere: ['Trace Oxygen (42%)', 'Sodium (29%)', 'Hydrogen (22%)', 'Helium (6%)'],
      color: '#9ca3af',
      overview: 'Innermost and smallest major planet. Experiences the most extreme surface temperature swings in the Solar System.',
      funFact: 'Due to orbital resonance, a single solar day on Mercury (sunrise to sunrise) takes 176 Earth days—twice as long as its year!',
    },
    textureType: 'mercury',
  },

  {
    id: 'venus',
    name: 'Venus',
    type: 'planet',
    orbitalElements: {
      a: 0.723332,
      e: 0.006773,
      i: 3.394,
      om: 76.680,
      w: 54.884,
      ma0: 50.115,
      periodDays: 224.701,
    },
    physical: {
      radiusKm: 6051.8,
      massKg: 4.8675e24,
      gravityMs2: 8.87,
      densityGcm3: 5.243,
      escapeVelocityKms: 10.36,
      rotationPeriodHours: -5832.5, // -243 Earth days (Retrograde rotation!)
      axialTiltDeg: 177.36,
      meanTempC: 464, // Runaway greenhouse
      atmosphere: ['Carbon Dioxide (96.5%)', 'Nitrogen (3.5%)', 'Sulfur Dioxide (0.015%)'],
      color: '#f59e0b',
      overview: 'Earth\'s "twin" in size, wrapped in thick sulfuric acid clouds with crushing 92-bar atmospheric surface pressure.',
      funFact: 'Venus rotates in retrograde (clockwise). The Sun rises in the west and sets in the east, and its day is longer than its year.',
    },
    hasAtmosphere: true,
    atmosphereColor: '#fde68a',
    textureType: 'venus',
  },

  {
    id: 'earth',
    name: 'Earth',
    type: 'planet',
    orbitalElements: {
      a: 1.000000,
      e: 0.016709,
      i: 0.00005,
      om: -11.260,
      w: 114.207, // Longitude of perihelion 102.947 minus ascending node -11.260.
      ma0: 357.517,
      periodDays: 365.256,
    },
    physical: {
      radiusKm: 6371.0,
      massKg: 5.9723e24,
      gravityMs2: 9.807,
      densityGcm3: 5.514,
      escapeVelocityKms: 11.19,
      rotationPeriodHours: 23.934,
      axialTiltDeg: 23.44,
      meanTempC: 15,
      atmosphere: ['Nitrogen (78.08%)', 'Oxygen (20.95%)', 'Argon (0.93%)', 'Carbon Dioxide (0.04%)'],
      color: '#38bdf8',
      overview: 'Our home world, the only known astronomical body confirmed to harbor life and stable liquid water oceans.',
      funFact: 'Earth\'s atmosphere protects us from meteoroids and radiation, while the active molten iron core creates our protective magnetic shield.',
    },
    hasAtmosphere: true,
    atmosphereColor: '#60a5fa',
    hasClouds: true,
    textureType: 'earth',
  },

  {
    id: 'mars',
    name: 'Mars',
    type: 'planet',
    orbitalElements: {
      a: 1.523679,
      e: 0.093405,
      i: 1.850,
      om: 49.558,
      w: 286.502,
      ma0: 19.373,
      periodDays: 686.980,
    },
    physical: {
      radiusKm: 3389.5,
      massKg: 6.4171e23,
      gravityMs2: 3.72,
      densityGcm3: 3.933,
      escapeVelocityKms: 5.03,
      rotationPeriodHours: 24.623,
      axialTiltDeg: 25.19,
      meanTempC: -65,
      atmosphere: ['Carbon Dioxide (95.3%)', 'Nitrogen (2.6%)', 'Argon (1.9%)', 'Oxygen (0.13%)'],
      color: '#ef4444',
      overview: 'The Red Planet, rich in iron oxide dust, home to Olympus Mons (tallest solar volcano) and Valles Marineris canyon.',
      funFact: 'A Martian day ("sol") is 24 hours, 39 minutes, 35 seconds—just 39 minutes longer than an Earth day!',
    },
    hasAtmosphere: true,
    atmosphereColor: '#fca5a5',
    textureType: 'mars',
  },

  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'planet',
    orbitalElements: {
      a: 5.2044,
      e: 0.048498,
      i: 1.303,
      om: 100.464,
      w: 273.867,
      ma0: 20.020,
      periodDays: 4332.589,
    },
    physical: {
      radiusKm: 69911,
      massKg: 1.8982e27,
      gravityMs2: 24.79,
      densityGcm3: 1.326,
      escapeVelocityKms: 59.5,
      rotationPeriodHours: 9.925, // Fastest rotation in the Solar System
      axialTiltDeg: 3.13,
      meanTempC: -110,
      atmosphere: ['Hydrogen (89.8%)', 'Helium (10.2%)', 'Methane (0.3%)', 'Ammonia (0.026%)'],
      color: '#f97316',
      overview: 'Largest planet in the Solar System. A gas giant with 2.5 times the mass of all other planets combined.',
      funFact: 'The Great Red Spot is an enormous anti-cyclonic storm larger than Earth that has raged continuously for over 350 years.',
    },
    hasAtmosphere: true,
    atmosphereColor: '#fed7aa',
    textureType: 'jupiter',
  },

  {
    id: 'saturn',
    name: 'Saturn',
    type: 'planet',
    orbitalElements: {
      a: 9.5826,
      e: 0.05555,
      i: 2.485,
      om: 113.665,
      w: 339.392,
      ma0: 317.020,
      periodDays: 10759.22,
    },
    physical: {
      radiusKm: 58232,
      massKg: 5.6834e26,
      gravityMs2: 10.44,
      densityGcm3: 0.687, // Less dense than water!
      escapeVelocityKms: 35.5,
      rotationPeriodHours: 10.656,
      axialTiltDeg: 26.73,
      meanTempC: -140,
      atmosphere: ['Hydrogen (96.3%)', 'Helium (3.25%)', 'Methane (0.45%)', 'Ammonia (0.026%)'],
      color: '#fcd34d',
      overview: 'Famous for its dazzling system of icy rings. It has the lowest mean density of any planet, light enough to float in water.',
      funFact: 'Saturn\'s iconic rings span over 282,000 km across, yet are extraordinarily razor-thin—typically just 10 to 30 meters thick!',
    },
    rings: {
      innerRadiusKm: 74500,
      outerRadiusKm: 140220,
      color: '#e2d3b3',
      opacity: 0.85,
    },
    hasAtmosphere: true,
    atmosphereColor: '#fef08a',
    textureType: 'saturn',
  },

  {
    id: 'uranus',
    name: 'Uranus',
    type: 'planet',
    orbitalElements: {
      a: 19.2184,
      e: 0.046381,
      i: 0.773,
      om: 74.006,
      w: 96.998,
      ma0: 142.238,
      periodDays: 30685.4,
    },
    physical: {
      radiusKm: 25362,
      massKg: 8.6810e25,
      gravityMs2: 8.69,
      densityGcm3: 1.270,
      escapeVelocityKms: 21.3,
      rotationPeriodHours: -17.24, // Retrograde
      axialTiltDeg: 97.77, // Rotates on its side!
      meanTempC: -195,
      atmosphere: ['Hydrogen (82.5%)', 'Helium (15.2%)', 'Methane (2.3%)'],
      color: '#67e8f9',
      overview: 'An ice giant with a blue-green hue from atmospheric methane. It rolls around the Sun almost completely on its side.',
      funFact: 'With its 97.8° tilt, each pole gets 42 Earth years of continuous sunlight followed by 42 years of freezing darkness.',
    },
    rings: {
      innerRadiusKm: 41800,
      outerRadiusKm: 51100,
      color: '#94a3b8',
      opacity: 0.45,
    },
    hasAtmosphere: true,
    atmosphereColor: '#a5f3fc',
    textureType: 'uranus',
  },

  {
    id: 'neptune',
    name: 'Neptune',
    type: 'planet',
    orbitalElements: {
      a: 30.1104,
      e: 0.009456,
      i: 1.769,
      om: 131.784,
      w: 273.187,
      ma0: 256.228,
      periodDays: 60189.0,
    },
    physical: {
      radiusKm: 24622,
      massKg: 1.0241e26,
      gravityMs2: 11.15,
      densityGcm3: 1.638,
      escapeVelocityKms: 23.5,
      rotationPeriodHours: 16.11,
      axialTiltDeg: 28.32,
      meanTempC: -200,
      atmosphere: ['Hydrogen (80.0%)', 'Helium (19.0%)', 'Methane (1.5%)'],
      color: '#3b82f6',
      overview: 'Distant deep-blue ice giant with the fastest supersonic winds in the Solar System, exceeding 2,100 km/h.',
      funFact: 'Neptune was the first planet located through mathematical prediction rather than empirical telescope searching.',
    },
    hasAtmosphere: true,
    atmosphereColor: '#93c5fd',
    textureType: 'neptune',
  },

  // ==================== DWARF PLANETS ====================
  {
    id: 'pluto',
    name: 'Pluto',
    type: 'dwarf',
    orbitalElements: {
      a: 39.482,
      e: 0.2488,
      i: 17.16,
      om: 110.30,
      w: 113.76,
      ma0: 14.53,
      periodDays: 90560,
    },
    physical: {
      radiusKm: 1188.3,
      massKg: 1.303e22,
      gravityMs2: 0.62,
      densityGcm3: 1.854,
      escapeVelocityKms: 1.21,
      rotationPeriodHours: -153.29,
      axialTiltDeg: 122.53,
      meanTempC: -229,
      atmosphere: ['Nitrogen (98%)', 'Methane (1.5%)', 'Carbon Monoxide (0.5%)'],
      color: '#d97706',
      overview: 'King of the Kuiper Belt with vast nitrogen-ice plains (Sputnik Planitia) and towering water-ice mountain ranges.',
      funFact: 'Pluto and its largest moon Charon form a binary system; their center of mass lies in empty space above Pluto\'s surface.',
    },
    textureType: 'pluto',
  },

  {
    id: 'ceres',
    name: 'Ceres',
    type: 'dwarf',
    orbitalElements: {
      a: 2.767,
      e: 0.0758,
      i: 10.59,
      om: 80.33,
      w: 73.60,
      ma0: 77.37,
      periodDays: 1682,
    },
    physical: {
      radiusKm: 469.7,
      massKg: 9.383e20,
      gravityMs2: 0.28,
      densityGcm3: 2.161,
      escapeVelocityKms: 0.51,
      rotationPeriodHours: 9.07,
      axialTiltDeg: 4.0,
      meanTempC: -106,
      atmosphere: ['Water vapor traces'],
      color: '#a1a1aa',
      overview: 'Largest body in the main asteroid belt, accounting for roughly a third of the belt\'s total mass.',
      funFact: 'NASA\'s Dawn mission discovered mysterious bright reflective sodium carbonate salt deposits inside Occator Crater.',
    },
    textureType: 'ceres',
  },

  {
    id: 'eris',
    name: 'Eris',
    type: 'dwarf',
    orbitalElements: {
      a: 67.781,
      e: 0.4407,
      i: 44.04,
      om: 35.87,
      w: 151.43,
      ma0: 205.99,
      periodDays: 203830,
    },
    physical: {
      radiusKm: 1163,
      massKg: 1.66e22,
      gravityMs2: 0.82,
      densityGcm3: 2.52,
      escapeVelocityKms: 1.38,
      rotationPeriodHours: 25.9,
      axialTiltDeg: 78.0,
      meanTempC: -243,
      atmosphere: ['Trace frozen methane'],
      color: '#e2e8f0',
      overview: 'Massive trans-Neptunian dwarf planet whose discovery in 2005 prompted the IAU definition of planet.',
      funFact: 'Eris is 27% more massive than Pluto, despite having an almost identical diameter.',
    },
    textureType: 'eris',
  },

  {
    id: 'haumea',
    name: 'Haumea',
    type: 'dwarf',
    orbitalElements: {
      a: 43.218,
      e: 0.1913,
      i: 28.19,
      om: 121.90,
      w: 240.20,
      ma0: 215.70,
      periodDays: 103774,
    },
    physical: {
      radiusKm: 798,
      massKg: 4.01e21,
      gravityMs2: 0.40,
      densityGcm3: 1.885,
      escapeVelocityKms: 0.84,
      rotationPeriodHours: 3.915, // Extremely fast!
      axialTiltDeg: 126.0,
      meanTempC: -241,
      atmosphere: ['None detected'],
      color: '#cbd5e1',
      overview: 'Elongated triaxial ellipsoid dwarf planet shaped like an American football due to its blistering 3.9-hour spin.',
      funFact: 'Haumea is the only known Kuiper Belt object to possess its own confirmed ring system, discovered in 2017.',
    },
    rings: {
      innerRadiusKm: 2200,
      outerRadiusKm: 2350,
      color: '#cbd5e1',
      opacity: 0.55,
    },
    textureType: 'haumea',
  },

  {
    id: 'makemake',
    name: 'Makemake',
    type: 'dwarf',
    orbitalElements: {
      a: 45.791,
      e: 0.1594,
      i: 28.96,
      om: 79.62,
      w: 295.42,
      ma0: 165.51,
      periodDays: 113183,
    },
    physical: {
      radiusKm: 715,
      massKg: 3.1e21,
      gravityMs2: 0.50,
      densityGcm3: 1.7,
      escapeVelocityKms: 0.8,
      rotationPeriodHours: 22.83,
      axialTiltDeg: 29.0,
      meanTempC: -240,
      atmosphere: ['Trace methane/nitrogen'],
      color: '#f87171',
      overview: 'Second-brightest Kuiper Belt object after Pluto, covered in pure frozen methane grains.',
      funFact: 'Named after the creator deity of the Rapa Nui people of Easter Island.',
    },
    textureType: 'makemake',
  },

  // ==================== MAJOR MOONS ====================
  {
    id: 'moon',
    name: 'Moon',
    type: 'moon',
    parentId: 'earth',
    moonOrbitalElements: {
      aKm: 384400,
      e: 0.0549,
      i: 5.145,
      om: 125.08,
      w: 318.15,
      ma0: 135.27,
      periodDays: 27.322,
    },
    physical: {
      radiusKm: 1737.4,
      massKg: 7.342e22,
      gravityMs2: 1.62,
      densityGcm3: 3.344,
      escapeVelocityKms: 2.38,
      rotationPeriodHours: 655.7, // Synchronous with orbit
      axialTiltDeg: 6.68,
      meanTempC: -20,
      atmosphere: ['Trace Helium', 'Neon', 'Hydrogen'],
      color: '#e4e4e7',
      overview: 'Earth\'s sole natural satellite. Fifth largest moon in the Solar System, tidally locked to Earth.',
      funFact: 'The Moon causes Earth\'s oceanic tides and stabilizes our planet\'s 23.4° axial tilt, preserving climate stability.',
    },
    textureType: 'moon',
  },

  {
    id: 'phobos',
    name: 'Phobos',
    type: 'moon',
    parentId: 'mars',
    moonOrbitalElements: {
      aKm: 9376,
      e: 0.0151,
      i: 1.093,
      om: 45.0,
      w: 120.0,
      ma0: 20.0,
      periodDays: 0.3189, // ~7.66 hours!
    },
    physical: {
      radiusKm: 11.26,
      massKg: 1.0659e16,
      gravityMs2: 0.0057,
      densityGcm3: 1.876,
      escapeVelocityKms: 0.011,
      rotationPeriodHours: 7.65,
      axialTiltDeg: 0,
      meanTempC: -40,
      atmosphere: ['None'],
      color: '#78716c',
      overview: 'Larger inner moon of Mars, orbiting faster than Mars rotates (rises in west, sets in east twice daily).',
      funFact: 'Phobos is spiraling inward at 1.8 meters per century; in ~50 million years it will break apart into a Martian ring.',
    },
    textureType: 'phobos',
  },

  {
    id: 'deimos',
    name: 'Deimos',
    type: 'moon',
    parentId: 'mars',
    moonOrbitalElements: {
      aKm: 23463,
      e: 0.00033,
      i: 0.93,
      om: 75.0,
      w: 240.0,
      ma0: 160.0,
      periodDays: 1.263, // 30.3 hours
    },
    physical: {
      radiusKm: 6.2,
      massKg: 1.476e15,
      gravityMs2: 0.003,
      densityGcm3: 1.471,
      escapeVelocityKms: 0.0056,
      rotationPeriodHours: 30.3,
      axialTiltDeg: 0,
      meanTempC: -40,
      atmosphere: ['None'],
      color: '#a8a29e',
      overview: 'Smaller, outer moon of Mars. Has a smoother appearance than Phobos due to a thick blanket of powdery regolith filling its craters.',
      funFact: 'From the surface of Mars, Deimos appears like a brilliant bright star, taking 2.7 Earth days between rising in the east and setting in the west.',
    },
    textureType: 'deimos',
  },

  {
    id: 'io',
    name: 'Io',
    type: 'moon',
    parentId: 'jupiter',
    moonOrbitalElements: {
      aKm: 421700,
      e: 0.0041,
      i: 0.05,
      om: 43.8,
      w: 84.1,
      ma0: 100.0,
      periodDays: 1.769,
    },
    physical: {
      radiusKm: 1821.6,
      massKg: 8.9319e22,
      gravityMs2: 1.796,
      densityGcm3: 3.528,
      escapeVelocityKms: 2.56,
      rotationPeriodHours: 42.46,
      axialTiltDeg: 0,
      meanTempC: -130,
      atmosphere: ['Sulfur dioxide (90%)'],
      color: '#facc15',
      overview: 'Most volcanically active body in the Solar System, boasting over 400 active volcanoes fueled by tidal heating.',
      funFact: 'Io\'s volcanic plumes erupt silicate lava and sulfur hundreds of kilometers into space at speeds exceeding 1 km/s.',
    },
    textureType: 'io',
  },

  {
    id: 'europa',
    name: 'Europa',
    type: 'moon',
    parentId: 'jupiter',
    moonOrbitalElements: {
      aKm: 670900,
      e: 0.009,
      i: 0.47,
      om: 219.0,
      w: 88.0,
      ma0: 40.0,
      periodDays: 3.551,
    },
    physical: {
      radiusKm: 1560.8,
      massKg: 4.7998e22,
      gravityMs2: 1.315,
      densityGcm3: 3.013,
      escapeVelocityKms: 2.025,
      rotationPeriodHours: 85.2,
      axialTiltDeg: 0.1,
      meanTempC: -160,
      atmosphere: ['Trace Molecular Oxygen'],
      color: '#fed7aa',
      overview: 'Smooth icy world crisscrossed by red fracture lines ("lineae"), concealing a global subsurface liquid ocean.',
      funFact: 'Europa\'s deep subsurface ocean may contain twice as much liquid water as all of Earth\'s oceans combined!',
    },
    textureType: 'europa',
  },

  {
    id: 'ganymede',
    name: 'Ganymede',
    type: 'moon',
    parentId: 'jupiter',
    moonOrbitalElements: {
      aKm: 1070400,
      e: 0.0013,
      i: 0.20,
      om: 63.5,
      w: 192.4,
      ma0: 240.0,
      periodDays: 7.155,
    },
    physical: {
      radiusKm: 2634.1,
      massKg: 1.4819e23,
      gravityMs2: 1.428,
      densityGcm3: 1.936,
      escapeVelocityKms: 2.74,
      rotationPeriodHours: 171.7,
      axialTiltDeg: 0.2,
      meanTempC: -163,
      atmosphere: ['Trace Oxygen'],
      color: '#94a3b8',
      overview: 'Largest moon in the Solar System—bigger than planet Mercury and dwarf planet Pluto.',
      funFact: 'Ganymede is the only known moon with its own internally generated magnetic field, complete with polar auroras.',
    },
    textureType: 'ganymede',
  },

  {
    id: 'callisto',
    name: 'Callisto',
    type: 'moon',
    parentId: 'jupiter',
    moonOrbitalElements: {
      aKm: 1882700,
      e: 0.0074,
      i: 0.28,
      om: 298.8,
      w: 52.6,
      ma0: 180.0,
      periodDays: 16.689,
    },
    physical: {
      radiusKm: 2410.3,
      massKg: 1.0759e23,
      gravityMs2: 1.235,
      densityGcm3: 1.834,
      escapeVelocityKms: 2.44,
      rotationPeriodHours: 400.5,
      axialTiltDeg: 0,
      meanTempC: -139,
      atmosphere: ['Trace Carbon Dioxide'],
      color: '#64748b',
      overview: 'Outermost Galilean moon, with the oldest, most heavily cratered surface observed in the Solar System.',
      funFact: 'Because it orbits outside Jupiter\'s intense radiation belt, Callisto is considered a prime site for future human bases.',
    },
    textureType: 'callisto',
  },

  {
    id: 'titan',
    name: 'Titan',
    type: 'moon',
    parentId: 'saturn',
    moonOrbitalElements: {
      aKm: 1221870,
      e: 0.0288,
      i: 0.348,
      om: 99.8,
      w: 175.8,
      ma0: 300.0,
      periodDays: 15.945,
    },
    physical: {
      radiusKm: 2574.7,
      massKg: 1.3452e23,
      gravityMs2: 1.352,
      densityGcm3: 1.88,
      escapeVelocityKms: 2.64,
      rotationPeriodHours: 382.7,
      axialTiltDeg: 0,
      meanTempC: -179,
      atmosphere: ['Nitrogen (95%)', 'Methane (4.9%)', 'Ethane/Hydrogen'],
      color: '#f59e0b',
      overview: 'Second-largest moon in the Solar System, possessing a dense atmosphere and liquid hydrocarbon lakes (Kraken Mare).',
      funFact: 'Titan is the only world other than Earth known to have stable surface lakes, rivers, and rain—made of liquid methane!',
    },
    hasAtmosphere: true,
    atmosphereColor: '#fbbf24',
    textureType: 'titan',
  },

  {
    id: 'enceladus',
    name: 'Enceladus',
    type: 'moon',
    parentId: 'saturn',
    moonOrbitalElements: {
      aKm: 238000,
      e: 0.0047,
      i: 0.01,
      om: 169.0,
      w: 212.0,
      ma0: 12.0,
      periodDays: 1.370,
    },
    physical: {
      radiusKm: 252.1,
      massKg: 1.08e20,
      gravityMs2: 0.113,
      densityGcm3: 1.61,
      escapeVelocityKms: 0.24,
      rotationPeriodHours: 32.88,
      axialTiltDeg: 0,
      meanTempC: -198,
      atmosphere: ['Water vapor geysers'],
      color: '#f1f5f9',
      overview: 'Pure white icy moon reflecting almost 100% of incoming sunlight, with warm hydrothermal vents at its south pole.',
      funFact: 'Cryovolcanic geysers blast water ice and organic compounds from its south pole tiger stripes, creating Saturn\'s E-ring.',
    },
    textureType: 'enceladus',
  },

  {
    id: 'mimas',
    name: 'Mimas',
    type: 'moon',
    parentId: 'saturn',
    moonOrbitalElements: {
      aKm: 185520,
      e: 0.0202,
      i: 1.574,
      om: 153.0,
      w: 80.0,
      ma0: 310.0,
      periodDays: 0.942,
    },
    physical: {
      radiusKm: 198.2,
      massKg: 3.75e19,
      gravityMs2: 0.064,
      densityGcm3: 1.15,
      escapeVelocityKms: 0.159,
      rotationPeriodHours: 22.61,
      axialTiltDeg: 0,
      meanTempC: -209,
      atmosphere: ['None'],
      color: '#e2e8f0',
      overview: 'Saturnian icy moon famously resembling the "Death Star" due to the colossal 130-kilometer-wide Herschel impact crater.',
      funFact: 'The colossal impact that created Herschel crater nearly shattered Mimas completely; fractures can still be seen on the opposite side.',
    },
    textureType: 'mimas',
  },

  {
    id: 'iapetus',
    name: 'Iapetus',
    type: 'moon',
    parentId: 'saturn',
    moonOrbitalElements: {
      aKm: 3560820,
      e: 0.0286,
      i: 15.47,
      om: 75.6,
      w: 275.8,
      ma0: 120.0,
      periodDays: 79.3215,
    },
    physical: {
      radiusKm: 734.5,
      massKg: 1.8056e21,
      gravityMs2: 0.223,
      densityGcm3: 1.088,
      escapeVelocityKms: 0.573,
      rotationPeriodHours: 1903.7, // 79.3 days, tidally locked
      axialTiltDeg: 0,
      meanTempC: -143,
      atmosphere: ['None'],
      color: '#71717a',
      overview: 'Famous "yin-yang" moon of Saturn with extreme dual coloration: pitch-black leading hemisphere (Cassini Regio) and snow-white trailing hemisphere.',
      funFact: 'Possesses a mysterious 20-kilometer-high equatorial mountain ridge that runs along three-quarters of its equator, giving it a walnut shape.',
    },
    textureType: 'iapetus',
  },

  {
    id: 'miranda',
    name: 'Miranda',
    type: 'moon',
    parentId: 'uranus',
    moonOrbitalElements: {
      aKm: 129390,
      e: 0.0013,
      i: 4.34,
      om: 326.0,
      w: 68.0,
      ma0: 190.0,
      periodDays: 1.413,
    },
    physical: {
      radiusKm: 235.8,
      massKg: 6.4e19,
      gravityMs2: 0.079,
      densityGcm3: 1.20,
      escapeVelocityKms: 0.193,
      rotationPeriodHours: 33.92,
      axialTiltDeg: 0,
      meanTempC: -213,
      atmosphere: ['None'],
      color: '#cbd5e1',
      overview: 'Uranian moon with the most extreme, chaotic jumble of canyons and terraced cliffs in the Solar System.',
      funFact: 'Home to Verona Rupes, the tallest known cliff face in the Solar System, plunging an astounding 20 kilometers (12 miles) straight down!',
    },
    textureType: 'miranda',
  },

  {
    id: 'titania',
    name: 'Titania',
    type: 'moon',
    parentId: 'uranus',
    moonOrbitalElements: {
      aKm: 435910,
      e: 0.0011,
      i: 0.34,
      om: 99.0,
      w: 280.0,
      ma0: 45.0,
      periodDays: 8.706,
    },
    physical: {
      radiusKm: 788.4,
      massKg: 3.4e21,
      gravityMs2: 0.367,
      densityGcm3: 1.711,
      escapeVelocityKms: 0.77,
      rotationPeriodHours: 208.94,
      axialTiltDeg: 0,
      meanTempC: -203,
      atmosphere: ['Trace Carbon Dioxide'],
      color: '#94a3b8',
      overview: 'Largest moon of Uranus and eighth largest in the Solar System, cut by enormous rift fault canyons like Messina Chasma.',
      funFact: 'Messina Chasma is a colossal canyon system spanning over 1,500 kilometers across Titania—comparable to the Grand Canyon on Earth!',
    },
    textureType: 'titania',
  },

  {
    id: 'triton',
    name: 'Triton',
    type: 'moon',
    parentId: 'neptune',
    moonOrbitalElements: {
      aKm: 354759,
      e: 0.000016,
      i: 156.885, // Retrograde orbit around Neptune!
      om: 177.0,
      w: 320.0,
      ma0: 80.0,
      periodDays: 5.877, // Retrograde is encoded by inclination, not negative time.
    },
    physical: {
      radiusKm: 1353.4,
      massKg: 2.14e22,
      gravityMs2: 0.779,
      densityGcm3: 2.061,
      escapeVelocityKms: 1.455,
      rotationPeriodHours: -141.0,
      axialTiltDeg: 0,
      meanTempC: -235,
      atmosphere: ['Nitrogen (99%)', 'Methane'],
      color: '#cbd5e1',
      overview: 'Coldest measured planetary surface in the Solar System, captured from the Kuiper Belt by Neptune.',
      funFact: 'Triton orbits backward relative to Neptune\'s rotation. It features active geysers that erupt sublimated nitrogen gas.',
    },
    textureType: 'triton',
  },

  {
    id: 'charon',
    name: 'Charon',
    type: 'moon',
    parentId: 'pluto',
    moonOrbitalElements: {
      aKm: 19591,
      e: 0.0002,
      i: 0.0,
      om: 0.0,
      w: 0.0,
      ma0: 0.0,
      periodDays: 6.387,
    },
    physical: {
      radiusKm: 606.0,
      massKg: 1.586e21,
      gravityMs2: 0.288,
      densityGcm3: 1.702,
      escapeVelocityKms: 0.59,
      rotationPeriodHours: 153.29,
      axialTiltDeg: 0,
      meanTempC: -220,
      atmosphere: ['None detected'],
      color: '#94a3b8',
      overview: 'Pluto\'s giant moon, with half Pluto\'s diameter. Has a distinctive reddish-brown north polar cap named Mordor Macula.',
      funFact: 'Pluto and Charon are mutually tidally locked: the same faces always point at each other permanently.',
    },
    textureType: 'charon',
  },

  // ==================== COMETS ====================
  {
    id: 'halley',
    name: '1P/Halley',
    type: 'comet',
    orbitalElements: {
      a: 17.94,
      e: 1 - 0.5871 / 17.94, // NASA radial/event calibration; orientation remains illustrative.
      i: 162.26,  // Retrograde inclination
      om: 58.42,
      w: 111.33,
      ma0: 0,
      perihelionJD: 2446470.5, // NASA 1986-02-09, day precision only.
      periodDays: 365.2568983 * Math.pow(17.94, 1.5),
      epochJD: 2446470.5,
      modelRangeJD: [2446440.5, 2446500.5],
      provenance: { status: 'mixed', sourceUrls: ['https://science.nasa.gov/solar-system/comets/1p-halley/', 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/cometfact.html'], note: 'Event-local radial model: sourced perihelion date/distance and rounded semimajor axis; legacy node/periapsis angles are unverified. No predictive return accuracy.' },
    },
    physical: {
      radiusKm: 5.5,
      massKg: 2.2e14,
      gravityMs2: 0.0016,
      densityGcm3: 0.6,
      escapeVelocityKms: 0.002,
      rotationPeriodHours: 52.8,
      axialTiltDeg: 18.0,
      meanTempC: -70,
      atmosphere: ['Water, Carbon Monoxide, Methane, Ammonia coma'],
      color: '#38bdf8',
      overview: 'Most famous periodic comet in history. Recorded by astronomers worldwide since at least 240 BCE.',
      funFact: 'At perihelion (0.586 AU), it speeds at 54 km/s. At aphelion (35.1 AU beyond Neptune), it slows to just 0.91 km/s.',
    },
    textureType: 'comet',
  },

  {
    id: 'encke',
    name: '2P/Encke',
    type: 'comet',
    orbitalElements: {
      a: 2.21,
      e: 1 - 0.340 / 2.21,
      i: 11.78,
      om: 334.57,
      w: 186.54,
      ma0: 0,
      perihelionJD: 2453001.5, // NASA 2003-12-28, day precision only.
      periodDays: 365.2568983 * Math.pow(2.21, 1.5),
      epochJD: 2453001.5,
      modelRangeJD: [2452971.5, 2453031.5],
      provenance: { status: 'mixed', sourceUrls: ['https://nssdc.gsfc.nasa.gov/planetary/factsheet/cometfact.html'], note: 'Event-local radial model: sourced date, distance and rounded semimajor axis; legacy orientation is unverified. Other returns are illustrative.' },
    },
    physical: {
      radiusKm: 2.4,
      massKg: 3.1e13,
      gravityMs2: 0.001,
      densityGcm3: 0.5,
      escapeVelocityKms: 0.001,
      rotationPeriodHours: 15.08,
      axialTiltDeg: 12.0,
      meanTempC: -50,
      atmosphere: ['Cyanogen, Carbon, Water coma'],
      color: '#34d399',
      overview: 'Shortest-period known comet in the Solar System, completing an orbit around the Sun every 3.3 years.',
      funFact: 'Responsible for the annual Taurid meteor showers that illuminate Earth\'s skies every November.',
    },
    textureType: 'comet',
  },

  {
    id: 'halebopp',
    name: 'C/1995 O1 (Hale-Bopp)',
    type: 'comet',
    orbitalElements: {
      a: 0.9141178 / (1 - 0.9950967),
      e: 0.9950967,
      i: 89.42975,
      om: 282.47076,
      w: 130.59092,
      ma0: 0,
      perihelionJD: 2450539.63838,
      periodDays: 365.2568983 * Math.pow(0.9141178 / (1 - 0.9950967), 1.5),
      epochJD: 2450540.5,
      modelRangeJD: [2450508.5, 2450570.5],
      provenance: { status: 'sourced', sourceUrls: ['https://space.physics.uiowa.edu/vis/hale-bopp-ephem.html'], note: 'D. Yeomans, JPL solution 55, April 2 1997 local osculating elements in J2000 ecliptic, TDB. Two-body propagation; perturbations are omitted.' },
    },
    physical: {
      radiusKm: 30.0, // Exceptionally huge nucleus (~60 km diameter)
      massKg: 1.3e16,
      gravityMs2: 0.004,
      densityGcm3: 0.6,
      escapeVelocityKms: 0.015,
      rotationPeriodHours: 11.34,
      axialTiltDeg: 45.0,
      meanTempC: -150,
      atmosphere: ['Carbon Monoxide, Water, Sodium tail'],
      color: '#a78bfa',
      overview: 'The Great Comet of 1997, visible to the naked eye for a record-breaking 18 months.',
      funFact: 'Possessed a rare third tail made of neutral sodium atoms, spanning over 50 million kilometers through interplanetary space.',
    },
    textureType: 'comet',
  },
];

enrichCatalog(CELESTIAL_BODIES);

// Legacy numbers have no recoverable record-level source. Declare the intended simulation
// epoch and frame without pretending that their phase/pole orientation is an ephemeris.
for (const body of CELESTIAL_BODIES) {
  const orbit = body.orbitalElements ?? body.moonOrbitalElements;
  if (!orbit) continue;
  orbit.epochJD ??= J2000_JD;
  orbit.referencePlane ??= body.moonOrbitalElements && body.id !== 'moon' ? 'parent-equator' : 'ecliptic-j2000';
  orbit.provenance ??= {
    status: 'illustrative', sourceUrls: [],
    note: 'Legacy catalog values with unverified record-level provenance. J2000 is the assumed numerical phase epoch. Satellite phase/node/periapsis and static parent pole azimuth are illustrative.',
  };
}

/** Validate catalog boundaries independently of rendering. Returns errors rather than hiding bad records. */
export function validateCatalog(bodies: CelestialBody[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const body of bodies) {
    if (ids.has(body.id)) errors.push(`${body.id}: duplicate ID`);
    ids.add(body.id);
  }
  for (const body of bodies) {
    if (body.parentId && (!ids.has(body.parentId) || body.parentId === body.id)) errors.push(`${body.id}: invalid parent`);
    for (const [key,value] of Object.entries(body.physical)) {
      if (typeof value === 'number' && !Number.isFinite(value) && !(body.science?.unknownPhysical && Number.isNaN(value))) errors.push(`${body.id}: nonfinite ${key}`);
    }
    if ((!body.science?.unknownPhysical && !Number.isFinite(body.physical.radiusKm)) || body.physical.radiusKm <= 0 || body.physical.massKg <= 0 || body.physical.rotationPeriodHours === 0 || body.physical.axialTiltDeg < 0 || body.physical.axialTiltDeg > 180) errors.push(`${body.id}: invalid physical domain`);
    const orbit = body.orbitalElements ?? body.moonOrbitalElements;
    if (!orbit) {
      if (body.type !== 'star') errors.push(`${body.id}: missing orbit`);
      continue;
    }
    for (const [key,value] of Object.entries(orbit)) {
      if (typeof value === 'number' && !Number.isFinite(value)) errors.push(`${body.id}: nonfinite ${key}`);
    }
    const axis = 'a' in orbit ? orbit.a : orbit.aKm;
    if (!(axis > 0 && orbit.e >= 0 && orbit.e < 1 && orbit.i >= 0 && orbit.i <= 180 && orbit.periodDays > 0)) errors.push(`${body.id}: invalid orbital domain`);
    if (!Number.isFinite(orbit.epochJD) || !['ecliptic-j2000','parent-equator','laplace'].includes(orbit.referencePlane ?? '') || !orbit.provenance) errors.push(`${body.id}: missing conventions/provenance`);
    if (body.moonOrbitalElements && !body.parentId) errors.push(`${body.id}: missing moon parent`);
    if (orbit.modelRangeJD && (!orbit.modelRangeJD.every(Number.isFinite) || orbit.modelRangeJD[0] > orbit.modelRangeJD[1])) errors.push(`${body.id}: invalid local range`);
  }
  return errors;
}

/**
 * Quick lookup maps by ID
 */
export const CELESTIAL_BODY_MAP = new Map<string, CelestialBody>(
  CELESTIAL_BODIES.map((body) => [body.id, body])
);

/**
 * Filter bodies by category
 */
export const SUN = CELESTIAL_BODIES.find((b) => b.type === 'star')!;
export const PLANETS = CELESTIAL_BODIES.filter((b) => b.type === 'planet');
export const DWARF_PLANETS = CELESTIAL_BODIES.filter((b) => b.type === 'dwarf');
export const MOONS = CELESTIAL_BODIES.filter((b) => b.type === 'moon');
export const COMETS = CELESTIAL_BODIES.filter((b) => b.type === 'comet');
