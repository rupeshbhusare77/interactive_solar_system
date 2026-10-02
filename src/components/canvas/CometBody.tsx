/**
 * 3D Solar System Simulator — Comet Body Component
 * Extreme eccentric Keplerian orbits, coma, and dynamic ion/dust tails pointing away from the Sun.
 */

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CelestialBody } from '../../astronomy/types';
import { calculateEphemeris } from '../../astronomy/kepler';
import { scalePosition, scaleRadius } from '../../astronomy/scaling';
import { useSimulation } from '../../state/simulationContext';

interface CometBodyProps {
  comet: CelestialBody;
}

export const CometBody: React.FC<CometBodyProps> = ({ comet }) => {
  const {
    simulationDate,
    scaleMode,
    selectedBodyId,
    selectBody,
    hoveredBodyId,
    setHoveredBodyId,
  } = useSimulation();

  const groupRef = useRef<THREE.Group>(null);
  const tailGroupRef = useRef<THREE.Group>(null);
  const ionTailMeshRef = useRef<THREE.Mesh>(null);
  const dustTailMeshRef = useRef<THREE.Mesh>(null);

  const radius = scaleRadius(comet.physical.radiusKm, 'comet', scaleMode);
  const isSelected = selectedBodyId === comet.id;
  const isHovered = hoveredBodyId === comet.id;

  useFrame(() => {
    if (!comet.orbitalElements || !groupRef.current) return;

    // Ephemeris at current simulation time
    const ephemeris = calculateEphemeris(comet.orbitalElements, simulationDate);
    const scaledPos = scalePosition(ephemeris.positionAU, scaleMode);
    groupRef.current.position.set(scaledPos.x, scaledPos.y, scaledPos.z);

    // Orientation of the tail: points away from the Sun (origin [0,0,0])
    if (tailGroupRef.current) {
      const cometPos = new THREE.Vector3(scaledPos.x, scaledPos.y, scaledPos.z);
      const sunDirection = cometPos.clone().normalize();

      // Tail length based on distance to Sun
      const r = ephemeris.distanceAU;
      const activityFactor = Math.max(0, Math.min(1, (3.5 - r) / 3.0));
      const tailLength = Math.max(1.0, activityFactor * (scaleMode === 'educational' ? 22.0 : 70.0));

      const targetPoint = cometPos.clone().add(sunDirection.clone().multiplyScalar(tailLength));
      tailGroupRef.current.lookAt(targetPoint);

      if (ionTailMeshRef.current) {
        ionTailMeshRef.current.scale.set(1, 1, tailLength);
        (ionTailMeshRef.current.material as THREE.MeshBasicMaterial).opacity = activityFactor * 0.7;
      }
      if (dustTailMeshRef.current) {
        dustTailMeshRef.current.scale.set(1.4, 1.4, tailLength * 0.85);
        (dustTailMeshRef.current.material as THREE.MeshBasicMaterial).opacity = activityFactor * 0.45;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Comet Nucleus */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          selectBody(comet.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredBodyId(comet.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredBodyId(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>

      {/* Coma (glowing gaseous envelope around nucleus) */}
      <mesh>
        <sphereGeometry args={[radius * 2.2, 16, 16]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Cometary Tail Group */}
      <group ref={tailGroupRef}>
        <mesh ref={ionTailMeshRef} position={[0, 0, 0.5]}>
          <coneGeometry args={[radius * 1.5, 1, 16, 1, true]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        <mesh ref={dustTailMeshRef} position={[0.2, 0, 0.4]}>
          <coneGeometry args={[radius * 2.5, 1, 16, 1, true]} />
          <meshBasicMaterial
            color="#fef08a"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Selection indicator */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 2.5, radius * 2.8, 32]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Decluttered Comet Label (only shown when focused or hovered) */}
      {(isSelected || isHovered) && (
        <Html
          position={[0, radius + 0.6, 0]}
          center
          distanceFactor={24}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center">
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono whitespace-nowrap shadow-md ${
                isSelected
                  ? 'bg-sky-400 text-black font-semibold ring-1 ring-white'
                  : 'bg-black/85 text-sky-300 border border-sky-500/50 backdrop-blur-sm'
              }`}
            >
              ☄️ {comet.name}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
