/**
 * 3D Solar System Simulator — Astronomical Physics Verification Suite
 * Tests Kepler's equation solver, orbital mechanics, planetary positions,
 * and astronomical constants independently from WebGL rendering.
 */

import { solveKepler, calculateEphemeris, distanceBetween, dateToJulianDate } from './kepler';
import { CELESTIAL_BODY_MAP } from './celestialData';
import { J2000_JD, KM_PER_AU } from './constants';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Physics Test Failure: ${message}`);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

export function runPhysicsVerification() {
  console.log('=== STARTING ASTRONOMICAL PHYSICS VERIFICATION ===\n');

  // Test 1: Julian Date conversion at J2000.0
  const j2000Date = new Date('2000-01-01T12:00:00Z');
  const jd = dateToJulianDate(j2000Date);
  assert(Math.abs(jd - J2000_JD) < 1e-6, `J2000 Julian Date matches 2451545.0 (got ${jd})`);

  // Test 2: Kepler equation solver for circular orbit (e = 0)
  const M_circ = 1.2345;
  const E_circ = solveKepler(M_circ, 0.0);
  assert(Math.abs(E_circ - M_circ) < 1e-10, `Circular orbit Kepler solver E = M`);

  // Test 3: Kepler equation solver for Earth (e = 0.0167)
  const M_earth = 0.85;
  const e_earth = 0.016709;
  const E_earth = solveKepler(M_earth, e_earth);
  const M_recomputed_earth = E_earth - e_earth * Math.sin(E_earth);
  assert(
    Math.abs(M_recomputed_earth - M_earth) < 1e-10,
    `Earth orbit Kepler solver accurate to < 10^-10 rad`
  );

  // Test 4: Extreme eccentricity comet (Halley e = 0.96714)
  const M_halley = 0.35;
  const e_halley = 0.96714;
  const E_halley = solveKepler(M_halley, e_halley);
  const M_recomputed_halley = E_halley - e_halley * Math.sin(E_halley);
  assert(
    Math.abs(M_recomputed_halley - M_halley) < 1e-10,
    `Halley's comet extreme eccentricity (e=0.967) converges accurate to < 10^-10 rad`
  );

  // Test 5: Earth distance at J2000.0 epoch
  const earth = CELESTIAL_BODY_MAP.get('earth')!;
  const earthEphemeris = calculateEphemeris(earth.orbitalElements!, j2000Date);
  assert(
    earthEphemeris.distanceAU >= 0.983 && earthEphemeris.distanceAU <= 1.017,
    `Earth distance at J2000 is within perihelion/aphelion range: ${earthEphemeris.distanceAU.toFixed(4)} AU`
  );

  // Test 6: Distance measurement between Sun and Earth
  const sunPos = { x: 0, y: 0, z: 0 };
  const distSunEarth = distanceBetween(sunPos, earthEphemeris.positionAU);
  assert(
    Math.abs(distSunEarth - earthEphemeris.distanceAU) < 1e-6,
    `Sun-Earth distance vector magnitude equals ephemeris scalar distance`
  );

  // Test 7: Retrograde rotation flags
  const venus = CELESTIAL_BODY_MAP.get('venus')!;
  const uranus = CELESTIAL_BODY_MAP.get('uranus')!;
  assert(venus.physical.rotationPeriodHours < 0, `Venus has negative rotation period (retrograde)`);
  assert(uranus.physical.rotationPeriodHours < 0, `Uranus has negative rotation period (retrograde)`);
  assert(venus.physical.axialTiltDeg > 90, `Venus axial tilt is retrograde (${venus.physical.axialTiltDeg}°)`);

  console.log('\n=== ALL ASTRONOMICAL PHYSICS TESTS PASSED SUCCESSFULLY! ===');
}
