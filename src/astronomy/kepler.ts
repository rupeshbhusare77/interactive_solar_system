/**
 * 3D Solar System Simulator — Keplerian Orbital Physics Engine
 * Implements Kepler's Equation and 3D Orbital Mechanics from First Principles
 */

import { OrbitalElements, MoonOrbitalElements, Vector3D, Ephemeris, ScaleMode } from './types';
import { J2000_JD, KM_PER_AU } from './constants';
import { CELESTIAL_BODY_MAP } from './celestialData';
import { scalePosition, scaleMoonOffset, scaleRadius } from './scaling';

import { poleVector, equatorialToWorld } from './scienceCatalog';
import { referenceState } from './referenceEphemeris';

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
  const jd = dateToJulianDate(date);
  const d = jd - (elements.epochJD ?? J2000_JD);

  // Mean motion n (degrees per day)
  const n = 360 / elements.periodDays;

  // Mean anomaly M at time d
  let M_deg = (elements.perihelionJD === undefined ? elements.ma0 + n * d : n * (jd - elements.perihelionJD)) % 360;
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
    // Direction is carried by the directed pole, not a second reversal in local spin.
    const rotationDegreesPerDay = (24 / Math.abs(rotationPeriodHours)) * 360;
    rotationAngleDeg = ((rotationDegreesPerDay * d) % 360 + 360) % 360;
  }

  // Analytic derivative of the same fixed-element model, rotated into the world frame.
  const eccentricRate = n * DEG2RAD / (1 - elements.e * Math.cos(E_rad));
  const radialRate = elements.a * elements.e * Math.sin(E_rad) * eccentricRate;
  const transverseRate = r * Math.sqrt(1 - elements.e * elements.e) * eccentricRate / (1 - elements.e * Math.cos(E_rad));
  const velocityAUDay: Vector3D = {
    x: radialRate * (cosOm * cosU - sinOm * sinU * cosI) + transverseRate * (-cosOm * sinU - sinOm * cosU * cosI),
    y: radialRate * sinU * sinI + transverseRate * cosU * sinI,
    z: -(radialRate * (sinOm * cosU + cosOm * sinU * cosI) + transverseRate * (-sinOm * sinU + cosOm * cosU * cosI)),
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
  date: Date,
  parentTiltDeg: number = 0
): { offsetAU: Vector3D; distanceKm: number } {
  const d = dateToJulianDate(date) - (moonElements.epochJD ?? J2000_JD);
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

  const offsetAU = rotateParentEquator({x,y:z,z:-y}, moonElements, parentTiltDeg);
  return {
    offsetAU,
    distanceKm: rKm,
  };
}

/** Static illustrative pole uses the same world-X tilt as the planet surface/rings. */
export function rotateParentEquator(vector: Vector3D, elements: MoonOrbitalElements, parentTiltDeg: number): Vector3D {
  if ((elements.referencePlane === 'laplace' || elements.referencePlane === 'parent-equator') && elements.poleRA !== undefined && elements.poleDec !== undefined) {
    const pole=poleVector(elements.poleRA,elements.poleDec);
    const ra=elements.poleRA*Math.PI/180;
    const prime=equatorialToWorld(-Math.sin(ra),Math.cos(ra),0);
    const tangent={x:pole.y*prime.z-pole.z*prime.y,y:pole.z*prime.x-pole.x*prime.z,z:pole.x*prime.y-pole.y*prime.x};
    return {x:prime.x*vector.x+pole.x*vector.y-tangent.x*vector.z,y:prime.y*vector.x+pole.y*vector.y-tangent.y*vector.z,z:prime.z*vector.x+pole.z*vector.y-tangent.z*vector.z};
  }
  if (elements.referencePlane !== 'parent-equator') return vector;
  const tilt = parentTiltDeg * DEG2RAD;
  return {x:vector.x,y:vector.y*Math.cos(tilt)-vector.z*Math.sin(tilt),z:vector.y*Math.sin(tilt)+vector.z*Math.cos(tilt)};
}

/** Directed spin pole in world coordinates; signed catalog periods are descriptive only. */
export function calculateSpinAxis(tiltDeg: number): Vector3D {
  const tilt = tiltDeg * DEG2RAD;
  return {x:0,y:Math.cos(tilt),z:Math.sin(tilt)};
}

/** Satellite spin follows its directed orbital pole in this simplified synchronous model. */
export function calculateMoonSpinAxis(elements: MoonOrbitalElements, parentTiltDeg: number): Vector3D {
  const inclination = elements.i * DEG2RAD;
  const node = elements.om * DEG2RAD;
  return rotateParentEquator({x:Math.sin(node)*Math.sin(inclination),y:Math.cos(inclination),z:Math.cos(node)*Math.sin(inclination)},elements,parentTiltDeg);
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

export interface ResolvedBodyPosition {
  physicalAU: Vector3D;
  displayPosition: Vector3D;
  offsetAU?: Vector3D;
  displayOffset?: Vector3D;
}

/** Physical heliocentric coordinates and deliberately separate parent-relative display scaling. */
export function resolveBodyPosition(id: string, date: Date, mode: ScaleMode = 'real', ancestors: Set<string> = new Set()): ResolvedBodyPosition | null {
  if (!Number.isFinite(date.getTime()) || ancestors.has(id)) return null;
  const body = CELESTIAL_BODY_MAP.get(id);
  if (!body) return null;
  if (body.id === 'sun') return {physicalAU:{x:0,y:0,z:0},displayPosition:{x:0,y:0,z:0}};
  if (body.orbitalElements) {
    const physicalAU = referenceState(id,date)?.position ?? calculateEphemeris(body.orbitalElements,date).positionAU;
    if (!Object.values(physicalAU).every(Number.isFinite)) return null;
    return {physicalAU,displayPosition:scalePosition(physicalAU,mode)};
  }
  if (!body.moonOrbitalElements || !body.parentId) return null;
  const parent = CELESTIAL_BODY_MAP.get(body.parentId);
  const parentPosition = resolveBodyPosition(body.parentId,date,mode,new Set([...ancestors,id]));
  if (!parent || !parentPosition) return null;
  const offsetAU = referenceState(id,date)?.position ?? calculateMoonEphemeris(body.moonOrbitalElements,date,parent.physical.axialTiltDeg).offsetAU;
  if (!Object.values(offsetAU).every(Number.isFinite)) return null;
  const displayOffset = scaleMoonOffset(offsetAU,scaleRadius(parent.physical.radiusKm,parent.type,mode,parent.id),mode,parent.rings?parent.physical.radiusKm:undefined);
  return {
    physicalAU:{x:parentPosition.physicalAU.x+offsetAU.x,y:parentPosition.physicalAU.y+offsetAU.y,z:parentPosition.physicalAU.z+offsetAU.z},
    displayPosition:{x:parentPosition.displayPosition.x+displayOffset.x,y:parentPosition.displayPosition.y+displayOffset.y,z:parentPosition.displayPosition.z+displayOffset.z},
    offsetAU,displayOffset,
  };
}
