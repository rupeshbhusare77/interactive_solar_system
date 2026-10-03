import { useSceneFrame } from './useSceneFrame';
/**
 * 3D Solar System Simulator — Kuiper Belt Component
 * GPU-Instanced rendering of 2,200+ icy trans-Neptunian objects past 30 AU.
 */

import React, { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';

import { useSimulation } from '../../state/simulationContext';
import { scalePosition } from '../../astronomy/scaling';
import { solveKepler, getDaysSinceJ2000 } from '../../astronomy/kepler';

interface KuiperObject {
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  m0: number;
  n: number;
  size: number;
}

export const KuiperBelt: React.FC = () => {
  const { getSimulationDate, scaleMode, viewToggles } = useSimulation();
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);

  const count = 1800;

  const objects = useMemo<KuiperObject[]>(() => {
    const list: KuiperObject[] = [];
    const DEG2RAD = Math.PI / 180;

    for (let idx = 0; idx < count; idx++) {
      const a = 30.5 + Math.random() * 20;
      const e = 0.04 + Math.random() * 0.2;
      const iDeg = (Math.random() - 0.5) * 30;
      const i = iDeg * DEG2RAD;

      const om = Math.random() * Math.PI * 2;
      const w = Math.random() * Math.PI * 2;
      const m0 = Math.random() * Math.PI * 2;

      const periodDays = Math.pow(a, 1.5) * 365.256;
      const n = (Math.PI * 2) / periodDays;

      // Realistic speck size
      const size = Math.random() < 0.04 ? 0.08 : 0.03 + Math.random() * 0.03;

      list.push({ a, e, i, om, w, m0, n, size });
    }
    return list;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const colors = useMemo(() => {
    const values = new Float32Array(count * 3);
    const color = new THREE.Color();
    for (let index = 0; index < count; index++) {
      if (Math.random() < 0.6) color.setHSL(0.58, 0.25, 0.6 + Math.random() * 0.2);
      else color.setHSL(0.06, 0.35, 0.5 + Math.random() * 0.2);
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

  useSceneFrame(() => {
    if (!instancedMeshRef.current || !viewToggles.showKuiperBelt) return;

    const mesh = instancedMeshRef.current;
    const date = getSimulationDate();
    const timestamp = date.getTime();
    if (lastFrame.current.timestamp === timestamp && lastFrame.current.scale === scaleMode) return;
    const d = getDaysSinceJ2000(date);

    for (let idx = 0; idx < count; idx++) {
      const obj = objects[idx];
      const M = (obj.m0 + obj.n * d) % (Math.PI * 2);
      const E = solveKepler(M, obj.e);

      const r = obj.a * (1 - obj.e * Math.cos(E));
      const sinNu = (Math.sqrt(1 - obj.e * obj.e) * Math.sin(E)) / (1 - obj.e * Math.cos(E));
      const cosNu = (Math.cos(E) - obj.e) / (1 - obj.e * Math.cos(E));
      const nu = Math.atan2(sinNu, cosNu);

      const u = obj.w + nu;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);
      const cosOm = Math.cos(obj.om);
      const sinOm = Math.sin(obj.om);
      const cosI = Math.cos(obj.i);
      const sinI = Math.sin(obj.i);

      const posAU = {
        x: r * (cosOm * cosU - sinOm * sinU * cosI),
        y: r * (sinU * sinI),
        z: -r * (sinOm * cosU + cosOm * sinU * cosI),
      };

      const scaled = scalePosition(posAU, scaleMode);

      dummy.position.set(scaled.x, scaled.y, scaled.z);
      dummy.scale.setScalar(obj.size);
      dummy.updateMatrix();

      mesh.setMatrixAt(idx, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    lastFrame.current = { timestamp, scale: scaleMode };
  });

  if (!viewToggles.showKuiperBelt) return null;

  return (
    <instancedMesh
      ref={initializeMesh} name="kuiper-belt"
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.7} metalness={0.2} />
    </instancedMesh>
  );
};
