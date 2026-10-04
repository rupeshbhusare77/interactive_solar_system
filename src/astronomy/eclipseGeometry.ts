import { KM_PER_AU, SUN_RADIUS_KM } from './constants';
import { diskOverlap } from './phenomena';

/** Idealized physical geometry; event-specific ephemerides and local visibility are not inferred. */
export function eclipseGeometry(type: 'solar' | 'lunar', annular: boolean, phase: number) {
  const earthRadius = 6371, moonRadius = 1737.4;
  const solar = type === 'solar';
  const moonDistance = solar ? annular ? 405000 : 363000 : 384400;
  const moonOffset = (Math.max(0, Math.min(100, phase)) - 50) / 50 * (solar ? 6000 : 15000);
  const sourceDistance = solar ? KM_PER_AU - moonDistance : KM_PER_AU;
  const occluderRadius = solar ? moonRadius : earthRadius;
  const umbraLength = occluderRadius * sourceDistance / (SUN_RADIUS_KM - occluderRadius);
  const umbraRadius = earthRadius - moonDistance * (SUN_RADIUS_KM - earthRadius) / KM_PER_AU;
  const penumbraRadius = earthRadius + moonDistance * (SUN_RADIUS_KM + earthRadius) / KM_PER_AU;
  let status: string;
  if (solar) {
    const overlap = diskOverlap({ x: KM_PER_AU - earthRadius, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 }, SUN_RADIUS_KM,
      { x: KM_PER_AU - moonDistance, y: moonOffset, z: 0 }, moonRadius);
    status = overlap === 'total' ? 'Totality' : overlap === 'annular' ? 'Annularity' : overlap === 'partial' ? 'Partial eclipse' : 'Before or after eclipse';
  } else {
    const separation = Math.abs(moonOffset);
    status = separation + moonRadius <= umbraRadius ? 'Totality' : separation < umbraRadius + moonRadius ? 'Partial eclipse' : separation < penumbraRadius + moonRadius ? 'Penumbral eclipse' : 'Before or after eclipse';
  }
  const sunAngularRadius = Math.asin(SUN_RADIUS_KM / (KM_PER_AU - earthRadius));
  const moonAngularRadius = Math.asin(moonRadius / (moonDistance - earthRadius));
  return { status, moonOffset, moonDistance, umbraLength, umbraRadius, penumbraRadius,
    diskOffset: solar ? Math.atan2(moonOffset, moonDistance - earthRadius) / sunAngularRadius * 62 : moonOffset / moonRadius * 62,
    moonDiskRadius: moonAngularRadius / sunAngularRadius * 62 };
}
