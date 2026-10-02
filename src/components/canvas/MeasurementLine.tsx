/**
 * 3D Solar System Simulator — Real-Time Astronomical Measurement Line
 * Draws an interactive 3D laser vector between two celestial bodies with dynamic distance & light-time HUD.
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useSimulation } from '../../state/simulationContext';
import { CELESTIAL_BODY_MAP } from '../../astronomy/celestialData';
import { calculateEphemeris, distanceBetween } from '../../astronomy/kepler';
import { scalePosition } from '../../astronomy/scaling';
import { KM_PER_AU, LIGHT_SECONDS_PER_AU } from '../../astronomy/constants';

export const MeasurementLine: React.FC = () => {
  const { simulationDate, scaleMode, measurementOriginId, measurementTargetId } = useSimulation();

  const midpointRef = useRef<THREE.Group>(null);
  const [hudData, setHudData] = React.useState({
    distAU: 0,
    distMillionKm: 0,
    lightTimeStr: '',
  });

  const originBody = measurementOriginId ? CELESTIAL_BODY_MAP.get(measurementOriginId) : null;
  const targetBody = measurementTargetId ? CELESTIAL_BODY_MAP.get(measurementTargetId) : null;

  const lineGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(6); // 2 vertices x 3 coordinates
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, []);

  const lineObject = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: '#38bdf8',
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    return new THREE.Line(lineGeometry, mat);
  }, [lineGeometry]);

  useFrame(() => {
    if (!originBody || !targetBody || originBody.id === targetBody.id) return;

    // Get 3D heliocentric position in AU
    const posA_AU = originBody.id === 'sun'
      ? { x: 0, y: 0, z: 0 }
      : originBody.orbitalElements
      ? calculateEphemeris(originBody.orbitalElements, simulationDate).positionAU
      : { x: 0, y: 0, z: 0 };

    const posB_AU = targetBody.id === 'sun'
      ? { x: 0, y: 0, z: 0 }
      : targetBody.orbitalElements
      ? calculateEphemeris(targetBody.orbitalElements, simulationDate).positionAU
      : { x: 0, y: 0, z: 0 };

    // Real astronomical distance in AU
    const distAU = distanceBetween(posA_AU, posB_AU);
    const distKm = distAU * KM_PER_AU;
    const distMillionKm = distKm / 1e6;

    // Light travel time
    const totalLightSeconds = distAU * LIGHT_SECONDS_PER_AU;
    let lightTimeStr = '';
    if (totalLightSeconds < 60) {
      lightTimeStr = `${totalLightSeconds.toFixed(1)} light-seconds`;
    } else if (totalLightSeconds < 3600) {
      const mins = Math.floor(totalLightSeconds / 60);
      const secs = Math.floor(totalLightSeconds % 60);
      lightTimeStr = `${mins}m ${secs}s light-time`;
    } else {
      const hours = (totalLightSeconds / 3600).toFixed(2);
      lightTimeStr = `${hours} light-hours`;
    }

    setHudData({ distAU, distMillionKm, lightTimeStr });

    // Scaled Three.js world coordinates
    const scaledA = scalePosition(posA_AU, scaleMode);
    const scaledB = scalePosition(posB_AU, scaleMode);

    const posAttr = lineGeometry.attributes.position as THREE.BufferAttribute;
    posAttr.setXYZ(0, scaledA.x, scaledA.y, scaledA.z);
    posAttr.setXYZ(1, scaledB.x, scaledB.y, scaledB.z);
    posAttr.needsUpdate = true;

    if (midpointRef.current) {
      midpointRef.current.position.set(
        (scaledA.x + scaledB.x) / 2,
        (scaledA.y + scaledB.y) / 2 + 1.5,
        (scaledA.z + scaledB.z) / 2
      );
    }
  });

  if (!originBody || !targetBody || originBody.id === targetBody.id) return null;

  return (
    <group>
      {/* 3D Laser Line using primitive to avoid JSX SVG line collision */}
      <primitive object={lineObject} />

      {/* Dynamic Midpoint HUD Badge */}
      <group ref={midpointRef}>
        <Html center distanceFactor={28} style={{ pointerEvents: 'none' }}>
          <div className="bg-space-900/90 border border-sky-500/60 rounded px-2.5 py-1 text-xs shadow-glow-cyan backdrop-blur-md whitespace-nowrap text-center">
            <div className="text-[10px] uppercase tracking-wider text-sky-400 font-mono">
              {originBody.name} ↔ {targetBody.name}
            </div>
            <div className="font-bold text-white font-mono">
              {hudData.distAU.toFixed(3)} AU{' '}
              <span className="text-zinc-400 font-normal">
                ({hudData.distMillionKm.toFixed(2)}M km)
              </span>
            </div>
            <div className="text-[10px] text-amber-300 font-mono">
              ⚡ {hudData.lightTimeStr}
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
};
