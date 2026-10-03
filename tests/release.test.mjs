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
