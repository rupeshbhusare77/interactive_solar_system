/**
 * 3D Solar System Simulator — Real NASA Photosphere Sun Body Component
 * Features official NASA SDO solar imagery, pulsating corona prominences,
 * multi-layered volumetric solar glow, and omnidirectional solar light source.
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SUN } from '../../astronomy/celestialData';
import { scaleRadius } from '../../astronomy/scaling';
import { useSimulation } from '../../state/simulationContext';
import { loadPlanetTexture } from '../../textures/textureLoader';

export const SunBody: React.FC = () => {
  const { scaleMode, selectedBodyId, selectBody, hoveredBodyId, setHoveredBodyId, viewToggles } =
    useSimulation();
  const sunMeshRef = useRef<THREE.Mesh>(null);
  const coronaMeshRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const flareGroupRef = useRef<THREE.Group>(null);

  const radius = scaleRadius(SUN.physical.radiusKm, 'star', scaleMode, 'sun');
  // Real NASA Solar Dynamics Observatory Photosphere Map
  const texture = useMemo(() => loadPlanetTexture('sun.jpg', 'sun'), []);

  const isSelected = selectedBodyId === 'sun';
  const isHovered = hoveredBodyId === 'sun';

  // Dynamic solar rotation and coronal pulsation
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();

    if (sunMeshRef.current) {
      sunMeshRef.current.rotation.y += delta * 0.04;
    }

    if (coronaMeshRef.current) {
      coronaMeshRef.current.rotation.y -= delta * 0.02;
      coronaMeshRef.current.rotation.z += delta * 0.015;
      const pulse = 1.0 + Math.sin(time * 1.5) * 0.025;
      coronaMeshRef.current.scale.set(pulse, pulse, pulse);
    }

    if (outerGlowRef.current) {
      const outerPulse = 1.0 + Math.cos(time * 0.8) * 0.035;
      outerGlowRef.current.scale.set(outerPulse, outerPulse, outerPulse);
    }

    if (flareGroupRef.current) {
      flareGroupRef.current.rotation.y += delta * 0.06;
      flareGroupRef.current.rotation.z += delta * 0.025;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Primary Solar Illuminator: Lights all planets & moons */}
      <pointLight
        position={[0, 0, 0]}
        intensity={3.4}
        distance={0}
        decay={0.08}
        color="#fffbf0"
      />

      {/* Photosphere Sphere */}
      <mesh
        ref={sunMeshRef}
        onClick={(e) => {
          e.stopPropagation();
          selectBody('sun');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredBodyId('sun');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredBodyId(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          map={texture}
          color="#ffffff"
        />
      </mesh>

      {/* Dynamic Magnetic Solar Prominence Flare Arcs */}
      <group ref={flareGroupRef}>
        <group rotation={[0.4, 0.3, 0.2]}>
          <mesh>
            <torusGeometry args={[radius * 1.018, radius * 0.024, 16, 48, Math.PI * 0.55]} />
            <meshBasicMaterial
              color="#ef4444"
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
        <group rotation={[-0.5, 0.9, -0.4]}>
          <mesh>
            <torusGeometry args={[radius * 1.025, radius * 0.02, 16, 48, Math.PI * 0.45]} />
            <meshBasicMaterial
              color="#f97316"
              transparent
              opacity={0.65}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
        <group rotation={[0.8, -0.6, 0.7]}>
          <mesh>
            <torusGeometry args={[radius * 1.02, radius * 0.018, 16, 48, Math.PI * 0.35]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>

      {/* Corona Inner Flare Mesh */}
      <mesh ref={coronaMeshRef}>
        <sphereGeometry args={[radius * 1.14, 48, 48]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.38}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Corona Mid Solar Prominences */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[radius * 1.35, 48, 48]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer Volumetric Atmosphere Haze */}
      <mesh>
        <sphereGeometry args={[radius * 1.6, 32, 32]} />
        <meshBasicMaterial
          color="#d97706"
          transparent
          opacity={0.09}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Selection Halo Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.45, radius * 1.5, 64]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}

      {/* Label / Billboard */}
      {(viewToggles.showLabels || isHovered || isSelected) && (
        <Html
          position={[0, radius + 1.8, 0]}
          center
          zIndexRange={[1, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center">
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold tracking-wider uppercase transition-all ${
                isSelected
                  ? 'bg-amber-400 text-black shadow-glow-gold ring-1 ring-white'
                  : 'bg-black/80 text-amber-300 border border-amber-500/50 backdrop-blur-sm'
              }`}
            >
              ☀️ Sun
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
