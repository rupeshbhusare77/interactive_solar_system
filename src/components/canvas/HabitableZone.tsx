/**
 * 3D Solar System Simulator — Habitable Zone Component
 * Visualizes the circumstellar "Goldilocks Zone" where liquid water can exist on planetary surfaces.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { HABITABLE_ZONE } from '../../astronomy/constants';
import { scalePosition } from '../../astronomy/scaling';
import { useSimulation } from '../../state/simulationContext';

export const HabitableZone: React.FC = () => {
  const { scaleMode, viewToggles } = useSimulation();

  const { innerRadius, outerRadius, optInnerRadius, optOuterRadius } = useMemo(() => {
    const conservativeInner = scalePosition({ x: HABITABLE_ZONE.conservativeInnerAU, y: 0, z: 0 }, scaleMode).x;
    const conservativeOuter = scalePosition({ x: HABITABLE_ZONE.conservativeOuterAU, y: 0, z: 0 }, scaleMode).x;
    const optimisticInner = scalePosition({ x: HABITABLE_ZONE.optimisticInnerAU, y: 0, z: 0 }, scaleMode).x;
    const optimisticOuter = scalePosition({ x: HABITABLE_ZONE.optimisticOuterAU, y: 0, z: 0 }, scaleMode).x;

    return {
      innerRadius: conservativeInner,
      outerRadius: conservativeOuter,
      optInnerRadius: optimisticInner,
      optOuterRadius: optimisticOuter,
    };
  }, [scaleMode]);

  if (!viewToggles.showHabitableZone) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {/* Optimistic Habitable Zone (Outer Faint Ring) */}
      <mesh position={[0, 0, -0.05]}>
        <ringGeometry args={[optInnerRadius, optOuterRadius, 96]} />
        <meshBasicMaterial
          color="#10b981"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Conservative Habitable Zone (Inner Brighter Ring) */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[innerRadius, outerRadius, 96]} />
        <meshBasicMaterial
          color="#22c55e"
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Boundary Rings */}
      <lineLoop>
        <bufferGeometry>
          {/* Inner ring line */}
        </bufferGeometry>
      </lineLoop>
    </group>
  );
};
