import { useSceneFrame } from './useSceneFrame';
/**
 * 3D Solar System Simulator — Asteroid Belt Component
 * GPU-Instanced rendering of 3,200+ subtle asteroids in Keplerian orbits between Mars and Jupiter.
 */

import React, { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';

import { useSimulation } from '../../state/simulationContext';
import { scalePosition } from '../../astronomy/scaling';
import { solveKepler, getDaysSinceJ2000 } from '../../astronomy/kepler';

interface AsteroidData {
  a: number;   // Semi-major axis (AU)
  e: number;   // Eccentricity
  i: number;   // Inclination (radians)
  om: number;  // Ascending node (radians)
  w: number;   // Arg of periapsis (radians)
  m0: number;  // Initial mean anomaly (radians)
  n: number;   // Mean motion (radians/day)
  size: number;
}

export const AsteroidBelt: React.FC = () => {
  const { getSimulationDate, scaleMode, viewToggles } = useSimulation();
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);

  const count = 2800;

  // Generate Keplerian orbital parameters for the main asteroid belt (2.2 - 3.2 AU)
  const asteroids = useMemo<AsteroidData[]>(() => {
    const list: AsteroidData[] = [];
    const DEG2RAD = Math.PI / 180;

    for (let idx = 0; idx < count; idx++) {
      // Main belt strictly between 2.2 and 3.25 AU (beyond Mars at 1.52 AU)
      const u = Math.random();
      const a = 2.2 + u * 1.05;

      // Realistic eccentricity distribution (mean ~0.08)
      const e = 0.03 + Math.random() * 0.16;

      // Inclination (concentrated near plane +/- 10 degrees)
      const iDeg = (Math.random() - 0.5) * 20;
      const i = iDeg * DEG2RAD;

      const om = Math.random() * Math.PI * 2;
      const w = Math.random() * Math.PI * 2;
      const m0 = Math.random() * Math.PI * 2;

      // Kepler's Third Law: P = a^1.5 Earth years
      const periodDays = Math.pow(a, 1.5) * 365.256;
      const n = (Math.PI * 2) / periodDays;

      // Realistic tiny asteroid speck size (not giant boulders that dwarf planets)
      const size = Math.random() < 0.05 ? 0.05 : 0.02 + Math.random() * 0.025;

      list.push({ a, e, i, om, w, m0, n, size });
    }
    return list;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const colors = useMemo(() => {
    const values = new Float32Array(count * 3);
    const color = new THREE.Color();
    for (let index = 0; index < count; index++) {
      if (Math.random() < 0.7) color.setHSL(0.08, 0.1, 0.4 + Math.random() * 0.2);
      else color.setHSL(0.12, 0.2, 0.5 + Math.random() * 0.2);
      color.toArray(values, index * 3);
    }
    return values;
  }, [count]);
  const lastFrame = useRef({ timestamp: NaN, scale: scaleMode });
  const initializeMesh = useCallback((mesh: THREE.InstancedMesh | null) => {
    instancedMeshRef.current = mesh;
    if (mesh) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
      lastFrame.current.timestamp = NaN;
    }
  }, [colors]);

  // Update asteroid positions dynamically according to Kepler's laws
  useSceneFrame(() => {
    if (!instancedMeshRef.current || !viewToggles.showAsteroidBelt) return;

    const mesh = instancedMeshRef.current;
    const date = getSimulationDate();
    const timestamp = date.getTime();
    if (lastFrame.current.timestamp === timestamp && lastFrame.current.scale === scaleMode) return;
    const d = getDaysSinceJ2000(date);

    for (let idx = 0; idx < count; idx++) {
      const ast = asteroids[idx];
      const M = (ast.m0 + ast.n * d) % (Math.PI * 2);

      // Solve Kepler's equation
      const E = solveKepler(M, ast.e);

      // Distance and true anomaly
      const r = ast.a * (1 - ast.e * Math.cos(E));
      const sinNu = (Math.sqrt(1 - ast.e * ast.e) * Math.sin(E)) / (1 - ast.e * Math.cos(E));
      const cosNu = (Math.cos(E) - ast.e) / (1 - ast.e * Math.cos(E));
      const nu = Math.atan2(sinNu, cosNu);

      const u = ast.w + nu;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);
      const cosOm = Math.cos(ast.om);
      const sinOm = Math.sin(ast.om);
      const cosI = Math.cos(ast.i);
      const sinI = Math.sin(ast.i);

      // Heliocentric coordinates
      const posAU = {
        x: r * (cosOm * cosU - sinOm * sinU * cosI),
        y: r * (sinU * sinI),
        z: -r * (sinOm * cosU + cosOm * sinU * cosI),
      };

      const scaled = scalePosition(posAU, scaleMode);

      dummy.position.set(scaled.x, scaled.y, scaled.z);
      dummy.scale.setScalar(ast.size);
      dummy.updateMatrix();

      mesh.setMatrixAt(idx, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    lastFrame.current = { timestamp, scale: scaleMode };
  });

  if (!viewToggles.showAsteroidBelt) return null;

  return (
    <instancedMesh
      ref={initializeMesh} name="asteroid-belt"
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.9} metalness={0.1} />
    </instancedMesh>
  );
};
