/**
 * 3D Solar System Simulator — Astronomical Types & Interfaces
 */

export type ScaleMode = 'educational' | 'real' | 'hybrid';

export type CameraMode = 'free' | 'focus' | 'follow' | 'top' | 'ecliptic';

export type CelestialType = 'star' | 'planet' | 'dwarf' | 'moon' | 'comet' | 'asteroid';

/**
 * Keplerian orbital elements referenced to J2000.0 epoch (heliocentric ecliptic)
 */
export interface OrbitalElements {
  /** Semi-major axis in Astronomical Units (AU) */
  a: number;
  /** Eccentricity (dimensionless, 0 <= e < 1 for elliptical orbits) */
  e: number;
  /** Inclination to ecliptic plane (degrees) */
  i: number;
  /** Longitude of the ascending node (degrees) */
  om: number; // Ω (Omega)
  /** Argument of periapsis (degrees) or longitude of perihelion */
  w: number;  // ω (omega)
  /** Mean anomaly at epoch J2000 (degrees) */
  ma0: number; // M0
  /** Orbital period in Julian days (or Earth years) */
  periodDays: number;
  /** Longitude of perihelion varpi = om + w (optional for quick calculation) */
  varpi?: number;
}

/**
 * Moon orbital elements relative to parent planet
 */
export interface MoonOrbitalElements {
  /** Semi-major axis in kilometers */
  aKm: number;
  /** Eccentricity */
  e: number;
  /** Inclination to planet's equatorial/orbital plane (degrees) */
  i: number;
  /** Longitude of ascending node (degrees) */
  om: number;
  /** Argument of periapsis (degrees) */
  w: number;
  /** Mean anomaly at epoch (degrees) */
  ma0: number;
  /** Orbital period in Earth days */
  periodDays: number;
}

/**
 * Physical characteristics of a celestial body (NASA/JPL values)
 */
export interface PhysicalProperties {
  /** Volumetric mean radius in km */
  radiusKm: number;
  /** Mass in kg */
  massKg: number;
  /** Surface gravity in m/s² */
  gravityMs2: number;
  /** Mean density in g/cm³ */
  densityGcm3: number;
  /** Escape velocity in km/s */
  escapeVelocityKms: number;
  /** Sidereal rotation period in Earth hours (negative for retrograde) */
  rotationPeriodHours: number;
  /** Axial tilt / obliquity to orbit (degrees) */
  axialTiltDeg: number;
  /** Mean surface temperature in Celsius */
  meanTempC: number;
  /** Atmospheric primary constituents */
  atmosphere: string[];
  /** Color theme for orbital lines & UI highlights */
  color: string;
  /** Brief astronomical overview */
  overview: string;
  /** Notable scientific fact */
  funFact: string;
}

/**
 * Planetary ring system definition
 */
export interface RingSystem {
  /** Inner radius in km */
  innerRadiusKm: number;
  /** Outer radius in km */
  outerRadiusKm: number;
  /** Color tint */
  color: string;
  /** Opacity */
  opacity: number;
}

/**
 * Complete celestial body specification
 */
export interface CelestialBody {
  id: string;
  name: string;
  type: CelestialType;
  parentId?: string; // e.g. for moons
  orbitalElements?: OrbitalElements;
  moonOrbitalElements?: MoonOrbitalElements;
  physical: PhysicalProperties;
  rings?: RingSystem;
  hasClouds?: boolean;
  hasAtmosphere?: boolean;
  atmosphereColor?: string;
  textureType: string;
}

/**
 * 3D Coordinates Vector
 */
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Real-time computed ephemeris for a body at a specific timestamp
 */
export interface Ephemeris {
  /** Heliocentric coordinates in AU (or parent-centric for moons in AU) */
  positionAU: Vector3D;
  /** Velocity vector in AU/day */
  velocityAUDay: Vector3D;
  /** Heliocentric distance in AU */
  distanceAU: number;
  /** True anomaly in degrees */
  trueAnomalyDeg: number;
  /** Heliocentric longitude in degrees */
  heliocentricLongitudeDeg: number;
  /** Current rotation angle around spin axis (degrees) */
  rotationAngleDeg: number;
}

/**
 * View visualization toggles
 */
export interface ViewToggles {
  showOrbits: boolean;
  showLabels: boolean;
  showHabitableZone: boolean;
  showAsteroidBelt: boolean;
  showKuiperBelt: boolean;
  showMoons: boolean;
  showLighting: boolean;
  showDistanceGrid: boolean;
}
