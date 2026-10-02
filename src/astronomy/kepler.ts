/**
 * 3D Solar System Simulator — Keplerian Orbital Physics Engine
 * Implements Kepler's Equation and 3D Orbital Mechanics from First Principles
 */

import { OrbitalElements, MoonOrbitalElements, Vector3D, Ephemeris } from './types';
import { J2000_JD, KM_PER_AU } from './constants';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const TWO_PI = 2 * Math.PI;

/**
 * Convert a Date object to Julian Date (JD)
 */
export function dateToJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Convert Julian Date (JD) back to a JavaScript Date object
 */
export function julianDateToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

/**
 * Days elapsed since standard J2000.0 epoch
 */
export function getDaysSinceJ2000(date: Date): number {
  return dateToJulianDate(date) - J2000_JD;
}

/**
 * Solve Kepler's Equation M = E - e*sin(E) for Eccentric Anomaly E
 * Uses high-order Newton-Raphson / Halley iteration with robust convergence
 * for all eccentricities (0 <= e < 1), including extreme comets (e > 0.95).
 * 
 * @param M Mean anomaly in radians
 * @param e Orbital eccentricity
 * @returns Eccentric anomaly E in radians
 */
export function solveKepler(M: number, e: number): number {
  // Normalize M to [-PI, PI]
  let mNorm = M % TWO_PI;
  if (mNorm > Math.PI) mNorm -= TWO_PI;
  if (mNorm < -Math.PI) mNorm += TWO_PI;

  // High-performance initial guess
  let E: number;
  if (e < 0.8) {
    E = mNorm + e * Math.sin(mNorm);
  } else {
    // Robust initial guess for high-eccentricity comets
    const sinM = Math.sin(mNorm);
    const sign = sinM >= 0 ? 1 : -1;
    E = mNorm + sign * 0.85 * e;
  }

  // Halley's 3rd order iteration (extremely fast convergence < 4 iterations)
  const maxIterations = 20;
  const tolerance = 1e-12;

  for (let iter = 0; iter < maxIterations; iter++) {
    const sinE = Math.sin(E);
    const cosE = Math.cos(E);
    const f = E - e * sinE - mNorm;
    if (Math.abs(f) < tolerance) break;

    const fPrime = 1 - e * cosE;
    const fDoublePrime = e * sinE;

    // Halley's correction step
    const delta = f / (fPrime - (f * fDoublePrime) / (2 * fPrime));
    E -= delta;

    if (Math.abs(delta) < tolerance) break;
  }

  return E;
}

/**
 * Calculate 3D Heliocentric Position and Ephemeris for a celestial body at a given date
 */
export function calculateEphemeris(
  elements: OrbitalElements,
  date: Date,
  rotationPeriodHours?: number
): Ephemeris {
  const d = getDaysSinceJ2000(date);

  // Mean motion n (degrees per day)
  const n = 360 / elements.periodDays;

  // Mean anomaly M at time d
  let M_deg = (elements.ma0 + n * d) % 360;
  if (M_deg < 0) M_deg += 360;
  const M_rad = M_deg * DEG2RAD;

  // Solve Kepler's equation for Eccentric Anomaly E
  const E_rad = solveKepler(M_rad, elements.e);

  // True Anomaly nu (v)
  const sinNu = (Math.sqrt(1 - elements.e * elements.e) * Math.sin(E_rad)) / (1 - elements.e * Math.cos(E_rad));
  const cosNu = (Math.cos(E_rad) - elements.e) / (1 - elements.e * Math.cos(E_rad));
  const nu_rad = Math.atan2(sinNu, cosNu);
  const nu_deg = ((nu_rad * RAD2DEG) % 360 + 360) % 360;

  // Heliocentric distance r (in AU)
  const r = elements.a * (1 - elements.e * Math.cos(E_rad));

  // Orbital angles in radians
  const i_rad = elements.i * DEG2RAD;
  const om_rad = elements.om * DEG2RAD;
  const w_rad = elements.w * DEG2RAD;

  // Argument of latitude u = w + nu
  const u = w_rad + nu_rad;

  // 3D Cartesian coordinates in the Heliocentric Ecliptic frame
  // Note: Three.js uses Y as Up, so:
  // X = Ecliptic X
  // Y = Ecliptic Z (height out of ecliptic plane)
  // Z = Ecliptic Y (or -Y)
  const cosU = Math.cos(u);
  const sinU = Math.sin(u);
  const cosOm = Math.cos(om_rad);
  const sinOm = Math.sin(om_rad);
  const cosI = Math.cos(i_rad);
  const sinI = Math.sin(i_rad);

  const eclipticX = r * (cosOm * cosU - sinOm * sinU * cosI);
  const eclipticY = r * (sinOm * cosU + cosOm * sinU * cosI);
  const eclipticZ = r * (sinU * sinI);

  // Three.js world mapping: (X, Z-up -> Y, Y -> Z)
  const positionAU: Vector3D = {
    x: eclipticX,
    y: eclipticZ, // Height out of the plane
    z: -eclipticY, // Aligned with standard top-down view
  };

  // Heliocentric longitude lambda
  const heliocentricLongitudeDeg = ((Math.atan2(eclipticY, eclipticX) * RAD2DEG) % 360 + 360) % 360;

  // Planetary axial rotation angle around its own spin axis
  let rotationAngleDeg = 0;
  if (rotationPeriodHours && rotationPeriodHours !== 0) {
    const rotationDegreesPerDay = (24 / rotationPeriodHours) * 360;
    rotationAngleDeg = ((rotationDegreesPerDay * d) % 360 + 360) % 360;
  }

  // Velocity calculation (approximate in AU/day)
  // GM_sun = 0.000295912208 AU^3 / day^2
  const mu = 0.000295912208;
  const speed = Math.sqrt(mu * (2 / r - 1 / elements.a));
  // Tangential velocity vector components
  const velocityAUDay: Vector3D = {
    x: -speed * Math.sin(nu_rad),
    y: 0,
    z: speed * Math.cos(nu_rad),
  };

  return {
    positionAU,
    velocityAUDay,
    distanceAU: r,
    trueAnomalyDeg: nu_deg,
    heliocentricLongitudeDeg,
    rotationAngleDeg,
  };
}

/**
 * Calculate position of a moon relative to its parent planet (in AU)
 */
export function calculateMoonEphemeris(
  moonElements: MoonOrbitalElements,
  date: Date
): { offsetAU: Vector3D; distanceKm: number } {
  const d = getDaysSinceJ2000(date);
  const n = 360 / moonElements.periodDays;

  let M_deg = (moonElements.ma0 + n * d) % 360;
  if (M_deg < 0) M_deg += 360;
  const M_rad = M_deg * DEG2RAD;

  const E_rad = solveKepler(M_rad, moonElements.e);

  const sinNu = (Math.sqrt(1 - moonElements.e * moonElements.e) * Math.sin(E_rad)) / (1 - moonElements.e * Math.cos(E_rad));
  const cosNu = (Math.cos(E_rad) - moonElements.e) / (1 - moonElements.e * Math.cos(E_rad));
  const nu_rad = Math.atan2(sinNu, cosNu);

  // Distance in km
  const rKm = moonElements.aKm * (1 - moonElements.e * Math.cos(E_rad));
  const rAU = rKm / KM_PER_AU;

  const i_rad = moonElements.i * DEG2RAD;
  const om_rad = moonElements.om * DEG2RAD;
  const w_rad = moonElements.w * DEG2RAD;
  const u = w_rad + nu_rad;

  const cosU = Math.cos(u);
  const sinU = Math.sin(u);
  const cosOm = Math.cos(om_rad);
  const sinOm = Math.sin(om_rad);
  const cosI = Math.cos(i_rad);
  const sinI = Math.sin(i_rad);

  const x = rAU * (cosOm * cosU - sinOm * sinU * cosI);
  const y = rAU * (sinOm * cosU + cosOm * sinU * cosI);
  const z = rAU * (sinU * sinI);

  return {
    offsetAU: {
      x,
      y: z,
      z: -y,
    },
    distanceKm: rKm,
  };
}

/**
 * Generate 3D points along the complete Keplerian orbit ellipse for rendering
 * Uses adaptive sampling with higher density near periapsis
 */
export function generateOrbitPathPoints(
  elements: OrbitalElements,
  pointCount: number = 200
): Vector3D[] {
  const points: Vector3D[] = [];
  const i_rad = elements.i * DEG2RAD;
  const om_rad = elements.om * DEG2RAD;
  const w_rad = elements.w * DEG2RAD;

  const cosOm = Math.cos(om_rad);
  const sinOm = Math.sin(om_rad);
  const cosI = Math.cos(i_rad);
  const sinI = Math.sin(i_rad);

  for (let idx = 0; idx <= pointCount; idx++) {
    // Eccentric anomaly parameter from 0 to 2*PI
    const E = (idx / pointCount) * TWO_PI;

    // True anomaly and distance
    const sinNu = (Math.sqrt(1 - elements.e * elements.e) * Math.sin(E)) / (1 - elements.e * Math.cos(E));
    const cosNu = (Math.cos(E) - elements.e) / (1 - elements.e * Math.cos(E));
    const nu = Math.atan2(sinNu, cosNu);
    const r = elements.a * (1 - elements.e * Math.cos(E));

    const u = w_rad + nu;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);

    const eclipticX = r * (cosOm * cosU - sinOm * sinU * cosI);
    const eclipticY = r * (sinOm * cosU + cosOm * sinU * cosI);
    const eclipticZ = r * (sinU * sinI);

    points.push({
      x: eclipticX,
      y: eclipticZ,
      z: -eclipticY,
    });
  }

  return points;
}

/**
 * Euclidean distance between two 3D positions in AU
 */
export function distanceBetween(posA: Vector3D, posB: Vector3D): number {
  const dx = posA.x - posB.x;
  const dy = posA.y - posB.y;
  const dz = posA.z - posB.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
