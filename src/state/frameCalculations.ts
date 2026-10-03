import { CELESTIAL_BODY_MAP } from '../astronomy/celestialData';
import { calculateEphemeris, calculateMoonEphemeris, ResolvedBodyPosition } from '../astronomy/kepler';
import { scalePosition, scaleMoonOffset, scaleRadius } from '../astronomy/scaling';
import { Ephemeris, ScaleMode } from '../astronomy/types';

import { referenceState, referenceRevision } from '../astronomy/referenceEphemeris';

/** One smooth-frame cache and one sampled-UI cache keep telemetry from evicting renderer work. */
export function createFrameCalculations(getDate: () => Date) {
  const caches = [0, 1].map(() => ({ revision:-1, time: NaN, ephemerides: new Map<string, Ephemeris | null>(), positions: new Map<string, ResolvedBodyPosition | null>() }));
  const cacheFor = (date: Date, sampled: boolean) => {
    const cache = caches[sampled ? 1 : 0];
    if (cache.time !== date.getTime() || cache.revision !== referenceRevision) {
      cache.revision=referenceRevision;
      cache.time = date.getTime();
      cache.ephemerides.clear();
      cache.positions.clear();
    }
    return cache;
  };
  const getBodyEphemeris = (id: string, date?: Date): Ephemeris | null => {
    const currentDate = date ?? getDate();
    const cache = cacheFor(currentDate, date !== undefined);
    if (cache.ephemerides.has(id)) return cache.ephemerides.get(id)!;
    const body = CELESTIAL_BODY_MAP.get(id);
    const result = body?.orbitalElements && Number.isFinite(currentDate.getTime())
      ? calculateEphemeris(body.orbitalElements, currentDate, body.physical.rotationPeriodHours) : null;
    const reference=referenceState(id,currentDate);
    if(result && reference) { result.positionAU=reference.position; result.velocityAUDay=reference.velocity; result.distanceAU=Math.hypot(reference.position.x,reference.position.y,reference.position.z); result.heliocentricLongitudeDeg=(Math.atan2(-reference.position.z,reference.position.x)*180/Math.PI+360)%360; }
    cache.ephemerides.set(id, result);
    return result;
  };
  const getBodyPosition = (id: string, mode: ScaleMode = 'real', date?: Date): ResolvedBodyPosition | null => {
    const currentDate = date ?? getDate();
    const cache = cacheFor(currentDate, date !== undefined);
    const key = `${mode}:${id}`;
    if (cache.positions.has(key)) return cache.positions.get(key)!;
    cache.positions.set(key, null); // Also terminates malformed parent cycles.
    const body = CELESTIAL_BODY_MAP.get(id);
    if (!body || !Number.isFinite(currentDate.getTime())) return null;
    let result: ResolvedBodyPosition | null = null;
    if (id === 'sun') result = { physicalAU: { x: 0, y: 0, z: 0 }, displayPosition: { x: 0, y: 0, z: 0 } };
    else if (body.orbitalElements) {
      const physicalAU = getBodyEphemeris(id, date)?.positionAU;
      if (physicalAU && Object.values(physicalAU).every(Number.isFinite)) result = { physicalAU, displayPosition: scalePosition(physicalAU, mode) };
    } else if (body.moonOrbitalElements && body.parentId) {
      const parent = CELESTIAL_BODY_MAP.get(body.parentId);
      const position = getBodyPosition(body.parentId, mode, date);
      if (parent && position) {
        const offsetAU = referenceState(id,currentDate)?.position ?? calculateMoonEphemeris(body.moonOrbitalElements, currentDate, parent.physical.axialTiltDeg).offsetAU;
        if (Object.values(offsetAU).every(Number.isFinite)) {
          const displayOffset = scaleMoonOffset(offsetAU, scaleRadius(parent.physical.radiusKm, parent.type, mode, parent.id), mode, parent.rings?parent.physical.radiusKm:undefined);
          result = { physicalAU: { x: position.physicalAU.x + offsetAU.x, y: position.physicalAU.y + offsetAU.y, z: position.physicalAU.z + offsetAU.z }, displayPosition: { x: position.displayPosition.x + displayOffset.x, y: position.displayPosition.y + displayOffset.y, z: position.displayPosition.z + displayOffset.z }, offsetAU, displayOffset };
        }
      }
    }
    cache.positions.set(key, result);
    return result;
  };
  return { getBodyEphemeris, getBodyPosition };
}
