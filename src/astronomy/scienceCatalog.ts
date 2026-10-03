import { SATURN_RINGS } from './rings';
import { SURFACE_MAPS } from './generated/surfaceMaps';
import { CelestialBody } from './types';
import { JPL_CATALOG } from './generated/jplCatalog';
export { JPL_CATALOG };
const ids: Record<string, number> = { sun:10, mercury:199, venus:299, earth:399, mars:499, jupiter:599, saturn:699, uranus:799, neptune:899, pluto:999 };
export const moonId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
export function enrichCatalog(bodies: CelestialBody[]) {
  for (const record of JPL_CATALOG.satellites) {
    const id = moonId(record.name);
    let body = bodies.find(candidate => candidate.id === id);
    const [epochDay,epochFraction='0']=record.epoch.split('.');
    const epochTime=Date.parse(epochDay+'T00:00:00Z')+Number('0.'+epochFraction)*86400000;
    const parentConstants=(JPL_CATALOG.constants as Record<string,{POLE_RA?:number[];POLE_DEC?:number[]}>)[ids[record.parent]];
    const orbit = { aKm: record.aKm, e: record.e, i: record.i, om: record.om, w: record.w, ma0: record.ma0, periodDays: record.periodDays,
      epochJD: epochTime / 86400000 + 2440587.5,
      referencePlane: record.frame === 'Laplace' ? 'laplace' as const : record.frame === 'ecliptic' ? 'ecliptic-j2000' as const : 'parent-equator' as const,
      poleRA: record.poleRA ?? (record.frame==='equatorial'?parentConstants?.POLE_RA?.[0]:undefined), poleDec: record.poleDec ?? (record.frame==='equatorial'?parentConstants?.POLE_DEC?.[0]:undefined),
      provenance: { status: 'sourced' as const, sourceUrls: [JPL_CATALOG.sources.elements], note: `JPL ${record.solution} mean elements, retrieved ${JPL_CATALOG.verifiedOn}. Fixed mean-element propagation is approximate; perturbations are not reconstructed.` } };
    const gm = record.gm !== null && record.gm > 0 ? record.gm : NaN;
    const radius = record.radius !== null && record.radius > 0 ? record.radius : NaN;
    if (!body) {
      body = { id, name: record.name, type:'moon', parentId:record.parent, moonOrbitalElements:orbit, textureType:'moon', physical: {
        radiusKm:radius, massKg:gm / 6.67430e-20, gravityMs2:gm / (radius * radius) * 1000, densityGcm3:record.density ?? NaN,
        escapeVelocityKms:Math.sqrt(2 * gm / radius), rotationPeriodHours:NaN, axialTiltDeg:NaN, meanTempC:NaN,
        atmosphere:[], color:'#a7b9ce', overview:`${record.name} is a natural satellite of ${record.parent}. Orbital data come from JPL; unmeasured properties are shown as unknown.`,
        funFact:'A navigation marker or reconstructed surface does not imply that this moon has been imaged in detail.',
      } };
      bodies.push(body);
    } else {
      body.moonOrbitalElements = orbit;
      if (Number.isFinite(radius)) body.physical.radiusKm = radius;
      if (Number.isFinite(gm)) { body.physical.massKg = gm / 6.67430e-20; body.physical.gravityMs2 = gm / (radius * radius) * 1000; body.physical.escapeVelocityKms = Math.sqrt(2 * gm / radius); }
      if (record.density !== null && record.density !== undefined) body.physical.densityGcm3 = record.density;
    }
    const constants = (JPL_CATALOG.constants as Record<string, {RADII?:number[]}>)[record.code];
    body.science = { code:record.code, physicalSource:JPL_CATALOG.sources.physical, unknownPhysical:true, appearance:SURFACE_MAPS.find(map=>map.id===id)?.appearance ?? 'Reconstructed appearance; not a measured global surface.', radiiKm:constants?.RADII };
  }
  const saturn=bodies.find(body=>body.id==='saturn');
  if(saturn?.rings){saturn.rings.innerRadiusKm=SATURN_RINGS.innerKm;saturn.rings.outerRadiusKm=SATURN_RINGS.outerKm;}
  for (const body of bodies) if (ids[body.id]) {
    const constants = (JPL_CATALOG.constants as Record<string, {RADII?:number[]}>)[ids[body.id]];
    body.science = { code:ids[body.id], physicalSource:JPL_CATALOG.sources.constants, unknownPhysical:false, appearance:'Legacy surface map; provenance must be checked in the asset inventory.', radiiKm:constants?.RADII };
  }
}
/** J2000 equatorial vector to the renderer's J2000 ecliptic axes. */
export function equatorialToWorld(x:number,y:number,z:number) {
  const obliquity = 23.439291111 * Math.PI / 180;
  return { x, y:-y*Math.sin(obliquity)+z*Math.cos(obliquity), z:-(y*Math.cos(obliquity)+z*Math.sin(obliquity)) };
}
export function poleVector(ra:number,dec:number) {
  const r = ra*Math.PI/180, d=dec*Math.PI/180;
  return equatorialToWorld(Math.cos(d)*Math.cos(r),Math.cos(d)*Math.sin(r),Math.sin(d));
}
/** Polynomial IAU orientation only; satellite periodic terms and lunar libration remain approximate. */
export function bodyOrientation(body:CelestialBody, jd:number) {
  const constants = (JPL_CATALOG.constants as Record<string, {POLE_RA?:number[]; POLE_DEC?:number[]; PM?:number[]}>)[body.science?.code ?? 0];
  if (!constants?.POLE_RA || !constants.POLE_DEC || !constants.PM || body.id === 'hyperion') return null;
  const days=jd-2451545, centuries=days/36525;
  const polynomial=(values:number[],time:number)=>values.reduce((sum,value,index)=>sum+value*time**index,0);
  const ra=polynomial(constants.POLE_RA,centuries), dec=polynomial(constants.POLE_DEC,centuries);
  return { pole:poleVector(ra,dec), meridian:polynomial(constants.PM,days)*Math.PI/180,
    prime:equatorialToWorld(-Math.sin(ra*Math.PI/180),Math.cos(ra*Math.PI/180),0) };
}
export function shapeScale(body:CelestialBody): [number,number,number] {
  const radii=body.science?.radiiKm;
  if (!radii || !Number.isFinite(body.physical.radiusKm)) return [1,1,1];
  return [radii[0]/body.physical.radiusKm,radii[2]/body.physical.radiusKm,radii[1]/body.physical.radiusKm];
}

