import { CelestialBody, ScaleMode } from './types';
import { CELESTIAL_BODIES } from './celestialData';
import { scaleRadius, scaleRingSystem, scalePosition, scaleMoonOffset } from './scaling';
import { KM_PER_AU } from './constants';

export type ViewRegion = 'inner' | 'outer' | 'full';

/** Bounding spheres include rings, elongated surfaces, atmospheres, and selection halos. */
export function bodyViewRadius(body: CelestialBody, mode: ScaleMode): number {
  const radius = scaleRadius(body.physical.radiusKm, body.type, mode, body.id);
  const shape = body.id === 'haumea' ? 1.85 : body.id === 'phobos' ? 1.45 : 1.3;
  let bound = radius * (body.type === 'star' ? 1.6 : Math.max(1.45, shape));
  if (body.rings) bound = Math.max(bound, scaleRingSystem(
    body.rings.innerRadiusKm, body.rings.outerRadiusKm, radius, body.physical.radiusKm, mode,
  ).outerRadius);
  return bound;
}

export function systemViewRadius(mode: ScaleMode, region: ViewRegion): number {
  const bodies = CELESTIAL_BODIES.filter(body => body.type === 'star' || (
    body.orbitalElements && (region === 'full' ||
      (region === 'inner' ? body.orbitalElements.a <= 4 : body.type !== 'comet'))
  ));
  let bound = region === 'inner' ? scalePosition({ x: 4, y: 0, z: 0 }, mode).x : 0;
  for (const body of bodies) {
    const aphelion = body.orbitalElements ? body.orbitalElements.a * (1 + body.orbitalElements.e) : 0;
    let extent = bodyViewRadius(body, mode);
    for (const moon of CELESTIAL_BODIES.filter(candidate => candidate.parentId === body.id)) {
      if (!moon.moonOrbitalElements) continue;
      const offset = scaleMoonOffset({
        x: moon.moonOrbitalElements.aKm * (1 + moon.moonOrbitalElements.e) / KM_PER_AU, y: 0, z: 0,
      }, scaleRadius(body.physical.radiusKm, body.type, mode, body.id), mode);
      extent = Math.max(extent, offset.x + bodyViewRadius(moon, mode));
    }
    bound = Math.max(bound, scalePosition({ x: aphelion, y: 0, z: 0 }, mode).x + extent);
  }
  return Math.max(bound, 0.001);
}

/** Exact sphere fit uses the narrower horizontal/vertical field of view. */
export function fitViewDistance(radius: number, verticalFovDegrees: number, aspect: number): number {
  const vertical = verticalFovDegrees * Math.PI / 360;
  const horizontal = Math.atan(Math.tan(vertical) * Math.max(aspect, 0.01));
  return radius / Math.sin(Math.min(vertical, horizontal)) * 1.15;
}
