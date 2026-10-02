/**
 * 3D Solar System Simulator — Coordinate & Object Scaling Engine
 * Provides Real (1:1 True Scale), Educational, and Hybrid (Semi-Logarithmic) scaling transformations.
 * Calibrated specifically for astronomical accuracy and proportional consistency across all modes.
 */

import { ScaleMode, Vector3D } from './types';
import { KM_PER_AU } from './constants';

export const REAL_SCALE_AU_UNITS = 250; // 1 AU = 250 Three.js units in Real scale

/**
 * Pedagogically tuned visual radii for Educational mode
 * Preserves true astronomical size hierarchy so students immediately grasp relative scale.
 * Note: Ganymede (0.72) and Titan (0.70) are strictly larger than planet Mercury (0.67)!
 */
const EDUCATIONAL_RADII: Record<string, number> = {
  // Star
  sun: 10.5,

  // Terrestrial Planets
  mercury: 0.67, // Small cratered rocky world (smaller than Ganymede & Titan!)
  venus: 1.52,   // Earth's twin (~95% Earth)
  earth: 1.60,   // Standard reference world (1.00x)
  mars: 0.95,    // Half the size of Earth (~53%)

  // Gas Giants & Ice Giants
  jupiter: 5.50, // Undisputed giant (king of planets)
  saturn: 4.60,  // Massive gas giant with rings out to 10.5
  uranus: 2.70,  // Ice giant (4x Earth)
  neptune: 2.62, // Ice giant twin to Uranus (3.9x Earth)

  // Dwarf Planets
  pluto: 0.38,
  eris: 0.37,
  haumea: 0.32,
  makemake: 0.30,
  ceres: 0.26,

  // Moons
  ganymede: 0.72, // Largest moon in Solar System (strictly bigger than Mercury!)
  titan: 0.70,    // Second largest moon (strictly bigger than Mercury!)
  callisto: 0.65, // Near-Mercury size
  io: 0.50,       // Galilean volcanic moon
  moon: 0.48,     // Earth's moon
  europa: 0.43,   // Galilean ice ocean moon
  triton: 0.38,   // Retrograde ice moon
  titania: 0.28,  // Largest moon of Uranus
  iapetus: 0.27,  // Two-tone yin-yang moon of Saturn
  charon: 0.25,   // Binary dwarf companion
  enceladus: 0.20,// Cryovolcanic ice moon
  miranda: 0.19,  // Chevron cliff canyon moon
  mimas: 0.18,    // "Death Star" Herschel crater moon
  phobos: 0.12,   // Martian potato asteroid
  deimos: 0.10,   // Martian outer asteroid
};

/**
 * Scale a 3D heliocentric position vector in AU to Three.js world space
 */
export function scalePosition(posAU: Vector3D, mode: ScaleMode): Vector3D {
  const r = Math.sqrt(posAU.x * posAU.x + posAU.y * posAU.y + posAU.z * posAU.z);
  if (r === 0) return { x: 0, y: 0, z: 0 };

  let scaledR: number;

  switch (mode) {
    case 'real':
      // True 1:1 linear astronomical distance (1 AU = 250 units)
      scaledR = r * REAL_SCALE_AU_UNITS;
      break;

    case 'hybrid':
      // Semi-logarithmic compression: 25 * ln(1 + 3 * r)
      scaledR = 25 * Math.log(1 + 3.0 * r);
      break;

    case 'educational':
    default:
      // Monotonic pedagogical power curve: 20 * r^0.65
      // Inner planets: 0.387 AU -> ~10.7, 1 AU -> 20.0, 5.2 AU -> ~58.5, 30 AU -> ~183.5
      scaledR = 20 * Math.pow(r, 0.65);
      break;
  }

  const factor = scaledR / r;
  return {
    x: posAU.x * factor,
    y: posAU.y * factor,
    z: posAU.z * factor,
  };
}

/**
 * Scale the visual radius of a celestial body (km -> Three.js world radius)
 */
export function scaleRadius(radiusKm: number, type: string, mode: ScaleMode, id?: string): number {
  switch (mode) {
    case 'real': {
      // 100% mathematically exact 1:1 true scale from real NASA physical constants
      const kmToUnits = REAL_SCALE_AU_UNITS / KM_PER_AU;
      return radiusKm * kmToUnits;
    }

    case 'hybrid': {
      // Preserves the exact same proportional analogy as Educational Mode
      if (id && EDUCATIONAL_RADII[id]) {
        return EDUCATIONAL_RADII[id] * 0.85;
      }
      if (type === 'star') return 8.9;
      if (type === 'comet') return 0.28;
      const ratio = radiusKm / 6371;
      return Math.max(0.12, 1.36 * Math.pow(ratio, 0.7));
    }

    case 'educational':
    default: {
      if (id && EDUCATIONAL_RADII[id]) {
        return EDUCATIONAL_RADII[id];
      }

      if (type === 'star') return 10.5;
      if (type === 'comet') return 0.35;
      if (type === 'moon') {
        const ratio = radiusKm / 1737.4;
        return Math.max(0.10, 0.48 * Math.pow(ratio, 0.6));
      }

      const ratio = radiusKm / 6371;
      if (ratio <= 1.0) {
        return 0.5 + 1.1 * Math.pow(ratio, 0.85);
      } else {
        return 1.6 + 2.7 * Math.pow(ratio - 1, 0.55);
      }
    }
  }
}

/**
 * Scale moon position offset relative to parent planet
 */
export function scaleMoonOffset(
  offsetAU: Vector3D,
  planetVisualRadius: number,
  mode: ScaleMode
): Vector3D {
  const rAU = Math.sqrt(offsetAU.x * offsetAU.x + offsetAU.y * offsetAU.y + offsetAU.z * offsetAU.z);
  if (rAU === 0) return { x: 0, y: 0, z: 0 };

  let scaledDistance: number;

  switch (mode) {
    case 'real':
      // True 1:1 real orbit distance relative to parent planet
      scaledDistance = rAU * REAL_SCALE_AU_UNITS;
      break;

    case 'hybrid': {
      // Proportional spacing safely outside planet radius
      const distanceKm = rAU * KM_PER_AU;
      const normalizedDistance = Math.pow(distanceKm / 384400, 0.45);
      scaledDistance = planetVisualRadius + 1.1 + normalizedDistance * 2.1;
      break;
    }

    case 'educational':
    default: {
      // Place moon safely outside planet sphere with orbit radius proportional to real distance
      const distanceKm = rAU * KM_PER_AU;
      const normalizedDistance = Math.pow(distanceKm / 384400, 0.45);
      scaledDistance = planetVisualRadius + 1.4 + normalizedDistance * 2.5;
      break;
    }
  }

  const factor = scaledDistance / rAU;
  return {
    x: offsetAU.x * factor,
    y: offsetAU.y * factor,
    z: offsetAU.z * factor,
  };
}

/**
 * Scale ring dimensions (km -> Three.js world radius)
 */
export function scaleRingSystem(
  innerKm: number,
  outerKm: number,
  planetVisualRadius: number,
  planetRadiusKm: number,
  mode: ScaleMode
): { innerRadius: number; outerRadius: number } {
  if (mode === 'real') {
    const kmToUnits = REAL_SCALE_AU_UNITS / KM_PER_AU;
    return {
      innerRadius: innerKm * kmToUnits,
      outerRadius: outerKm * kmToUnits,
    };
  }

  // Educational and Hybrid modes: scale relative to planet visual radius
  const innerRatio = innerKm / planetRadiusKm;
  const outerRatio = outerKm / planetRadiusKm;

  return {
    innerRadius: planetVisualRadius * innerRatio * 0.95,
    outerRadius: planetVisualRadius * outerRatio * 0.95,
  };
}
