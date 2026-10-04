import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { registerHooks } from 'node:module';
import ts from 'typescript';
import { createStaticServer } from '../serve.js';

// Use the installed compiler without changing production import conventions.
registerHooks({
  resolve(specifier, context, next) {
    try { return next(specifier, context); }
    catch (error) {
      if (specifier.startsWith('.') && !path.extname(specifier)) return next(specifier + '.ts', context);
      throw error;
    }
  },
  load(url, context, next) {
    if (!url.endsWith('.ts')) return next(url, context);
    return { format: 'module', shortCircuit: true, source: ts.transpileModule(
      ts.sys.readFile(fileURLToPath(url)),
      { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
    ).outputText };
  },
});
const { dateToJulianDate, solveKepler, resolveBodyPosition, distanceBetween } = await import('../src/astronomy/kepler.ts');
const { bodyViewRadius, fitViewDistance } = await import('../src/astronomy/viewBounds.ts');
const { CELESTIAL_BODIES } = await import('../src/astronomy/celestialData.ts');
const { eclipseGeometry } = await import('../src/astronomy/eclipseGeometry.ts');
const { cameraProgress } = await import('../src/components/canvas/cameraMotion.ts');
const { scalePosition, scaleRadius } = await import('../src/astronomy/scaling.ts');

test('educational and hybrid visibly differ while physical coordinates stay unchanged', () => {
  const earth = { x: 1, y: 0, z: 0 }, neptune = { x: 30, y: 0, z: 0 };
  assert.equal(scalePosition(earth, 'educational').x, 25);
  assert(Math.abs(scalePosition(earth, 'hybrid').x - 34.657359) < .000001);
  assert(scalePosition(neptune, 'hybrid').x < scalePosition(neptune, 'educational').x * .6);
  assert.equal(scaleRadius(6371, 'planet', 'educational', 'earth'), 1.6);
  assert.equal(scaleRadius(6371, 'planet', 'hybrid', 'earth'), 1.36);
  const date = new Date('2026-10-03T00:00:00Z');
  assert.deepEqual(resolveBodyPosition('earth', date, 'hybrid').physicalAU, resolveBodyPosition('earth', date, 'educational').physicalAU);
});

test('camera easing starts at the current pose and advances continuously', () => {
  assert.equal(cameraProgress(0), 0);
  assert.equal(cameraProgress(1.6), 1);
  let previous = 0;
  for (let elapsed = 0; elapsed <= 1.6; elapsed += .016) {
    const progress = cameraProgress(elapsed);
    assert(progress >= previous && progress - previous < .025);
    previous = progress;
  }
  assert(cameraProgress(.016) < .001);
  assert(cameraProgress(.8) > .49 && cameraProgress(.8) < .51);
});

test('eclipse geometry distinguishes solar totality, annularity, and lunar shadows', () => {
  assert.equal(eclipseGeometry('solar', false, 50).status, 'Totality');
  assert.equal(eclipseGeometry('solar', true, 50).status, 'Annularity');
  assert.equal(eclipseGeometry('lunar', false, 50).status, 'Totality');
  for (const type of ['solar', 'lunar']) {
    assert.equal(eclipseGeometry(type, false, 0).status, 'Before or after eclipse');
    assert.equal(eclipseGeometry(type, false, 100).status, 'Before or after eclipse');
    assert.match(eclipseGeometry(type, false, 65).status, /Partial|Penumbral/);
  }
  const total = eclipseGeometry('solar', false, 50);
  const annular = eclipseGeometry('solar', true, 50);
  assert(total.umbraLength > total.moonDistance);
  assert(annular.umbraLength < annular.moonDistance);
  assert(eclipseGeometry('lunar', false, 50).umbraRadius > 1737.4);
});

test('J2000, eccentric Kepler solutions, and physical moon positions', () => {
  assert.equal(dateToJulianDate(new Date('2000-01-01T12:00:00Z')), 2451545);
  for (const e of [0, 0.0167, 0.967]) for (const mean of [0, 0.1, 1, 3, 5]) {
    const eccentric = solveKepler(mean, e);
    assert(Math.abs(Math.atan2(Math.sin(eccentric - e * Math.sin(eccentric) - mean), Math.cos(eccentric - e * Math.sin(eccentric) - mean))) < 1e-9);
  }
  const date = new Date('2026-10-03T00:00:00Z');
  const earth = resolveBodyPosition('earth', date);
  const moon = resolveBodyPosition('moon', date);
  assert(earth && moon);
  const distance = distanceBetween(earth.physicalAU, moon.physicalAU);
  assert(distance > 0.0023 && distance < 0.0028);
  for (const mode of ['educational', 'hybrid', 'real']) {
    assert.deepEqual(resolveBodyPosition('moon', date, mode).physicalAU, moon.physicalAU);
    for (const body of CELESTIAL_BODIES) for (const aspect of [390 / 844, 16 / 9]) {
      const radius = bodyViewRadius(body, mode);
      const distance = fitViewDistance(radius, 45, aspect);
      const half = Math.min(Math.PI / 8, Math.atan(Math.tan(Math.PI / 8) * aspect));
      assert(distance * Math.sin(half) > radius);
    }
  }
});

test('static server rejects traversal, preserves 404s, and caches only hashed assets', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'solar-release-'));
  const dist = path.join(root, 'dist');
  await mkdir(path.join(dist, 'assets'), { recursive: true });
  await writeFile(path.join(dist, 'index.html'), '<html>Solar</html>');
  await writeFile(path.join(dist, 'assets', 'index-AbCd1234.js'), 'export {}');
  await writeFile(path.join(root, 'secret.txt'), 'private');
  await symlink(root, path.join(dist, 'outside'), 'junction');
  const server = createStaticServer(dist, { base: '/interactive_solar_system/' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const request = pathname => new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path: pathname }, response => {
      response.resume();
      response.on('end', () => resolve(response));
    }).on('error', reject);
  });
  try {
    const home = await request('/interactive_solar_system/');
    assert.equal(home.statusCode, 200);
    assert.equal(home.headers['cache-control'], 'no-cache');
    assert.equal((await request('/interactive_solar_system/missing.jpg')).statusCode, 404);
    assert.equal((await request('/interactive_solar_system/outside/secret.txt')).statusCode, 403);
    for (const pathname of ['/interactive_solar_system/../secret.txt', '/interactive_solar_system/%2e%2e/secret.txt', '/interactive_solar_system/%5c..%5csecret.txt', '/interactive_solar_system/file:stream']) {
      assert.equal((await request(pathname)).statusCode, 403);
    }
    assert.equal((await request('/interactive_solar_system/%ZZ')).statusCode, 400);
    assert.equal((await request('/interactive_solar_system/assets/index-AbCd1234.js')).headers['cache-control'], 'public, max-age=31536000, immutable');
  } finally {
    await new Promise(resolve => server.close(resolve));
    assert(path.resolve(root).startsWith(path.resolve(tmpdir(), 'solar-release-')));
    await rm(root, { recursive: true, force: true });
  }
});

const { validateCatalog, MOONS } = await import('../src/astronomy/celestialData.ts');
const { JPL_CATALOG, bodyOrientation, shapeScale } = await import('../src/astronomy/scienceCatalog.ts');
const { installReference, referenceState } = await import('../src/astronomy/referenceEphemeris.ts');
const { illuminatedFraction, diskOverlap, barycenter } = await import('../src/astronomy/phenomena.ts');
const { readFile } = await import('node:fs/promises');
const { calculateMoonSpinAxis } = await import('../src/astronomy/kepler.ts');
const { SURFACE_MAPS } = await import('../src/astronomy/generated/surfaceMaps.ts');
const { saturnRingOpacity } = await import('../src/astronomy/rings.ts');
test('sourced catalog, physical geometry, and withheld JPL reference checkpoints', async () => {
  assert.deepEqual(validateCatalog(CELESTIAL_BODIES), []);
  for(const map of SURFACE_MAPS)assert(decodeURIComponent(map.download.split('/').pop()).toLowerCase().includes(map.id), map.id+': surface belongs to another body');
  assert.equal(JPL_CATALOG.discoveries.filter(row => row.parent === 'saturn').length, 293);
  assert.equal(MOONS.filter(body => body.parentId === 'saturn').length, 291);
  assert.equal(MOONS.filter(body => body.parentId === 'pluto').length, 5);
  assert(MOONS.some(body => body.id === 'rhea'));
  for (const body of MOONS) assert(Number.isFinite(body.moonOrbitalElements.epochJD));
  const saturn = CELESTIAL_BODIES.find(body => body.id === 'saturn');
  for(const mode of ['educational','hybrid']) {
    const moon=MOONS.find(body=>body.id==='mimas');
    const offset=resolveBodyPosition(moon.id,new Date('2026-10-03T00:00:00Z'),mode).displayOffset;
    assert(Math.hypot(offset.x,offset.y,offset.z)>bodyViewRadius(saturn,mode)+bodyViewRadius(moon,mode),'Outer moons must not intersect enlarged rings');
  }
  assert(shapeScale(saturn)[1] < shapeScale(saturn)[0]);
  const uranus=CELESTIAL_BODIES.find(body=>body.id==='uranus');
  const titania=MOONS.find(body=>body.id==='titania');
  const orbitPole=calculateMoonSpinAxis({...titania.moonOrbitalElements,i:0},uranus.physical.axialTiltDeg);
  const parentPole=bodyOrientation(uranus,2451545).pole;
  assert(Math.hypot(orbitPole.x-parentPole.x,orbitPole.y-parentPole.y,orbitPole.z-parentPole.z)<1e-6,'Equatorial orbit must use the sourced parent pole');
  const pole = bodyOrientation(saturn, 2451545).pole;
  assert(Math.abs(Math.hypot(pole.x,pole.y,pole.z)-1) < 1e-12);
  assert.equal(saturnRingOpacity(133500),0);
  assert.equal(saturnRingOpacity(136500),0);
  assert(saturnRingOpacity(100000)>saturnRingOpacity(120000));
  assert.equal(bodyOrientation(MOONS.find(body=>body.id==='hyperion'),2451545),null);
  const origin={x:0,y:0,z:0},sun={x:10,y:0,z:0},body={x:1,y:0,z:0};
  assert.equal(illuminatedFraction(body,sun,origin),0);
  assert.equal(illuminatedFraction(body,sun,{x:2,y:0,z:0}),1);
  assert.equal(diskOverlap(origin,sun,1,body,0.2),'total');
  assert.equal(diskOverlap(origin,sun,1,body,0.02),'annular');
  assert.equal(diskOverlap(origin,sun,1,{x:1,y:3,z:0},0.2),'none');
  assert.equal(diskOverlap(origin,sun,1,{x:20,y:0,z:0},2),'none');
  assert.deepEqual(barycenter(origin,3,{x:4,y:0,z:0},1),{x:1,y:0,z:0});
  assert.equal(barycenter(origin,NaN,body,1),null);
  const manifest=JSON.parse(await readFile(new URL('../public/science/manifest.json',import.meta.url),'utf8'));
  for(const record of manifest.bodies) {
    const data=JSON.parse(await readFile(new URL('../public/science/'+record.id+'.json',import.meta.url),'utf8'));
    installReference(data);
    for(const checkpoint of data.validation.checkpoints) {
      const time=new Date((checkpoint[0]-2440587.5)*86400000);
      const actual=referenceState(record.id,time).position;
      const expected={x:checkpoint[1],y:checkpoint[3],z:-checkpoint[2]};
      assert(distanceBetween(actual,expected)*149597870.7 <= 5, `${record.id}: reference interpolation drift`);
    }
    assert.equal(referenceState(record.id,new Date('2025-01-01')),null);
  }
  const date=new Date('2026-10-03T00:00:00Z');
  for(const mode of ['educational','hybrid','real'])assert.deepEqual(resolveBodyPosition('titan',date,mode).physicalAU,resolveBodyPosition('titan',date,'real').physicalAU);
});


const { nearestProjectedMarker } = await import('../src/astronomy/markerPicking.ts');
test('small moon selection uses pixel distance rather than world-scale radius',()=>{
  assert.equal(nearestProjectedMarker([100,100,1,200,200,1],200,200),1);
  assert.equal(nearestProjectedMarker([100,100,1,200,200,1],150,150),null);
  assert.equal(nearestProjectedMarker([198,200,1,200,200,1],200,200),1);
});
