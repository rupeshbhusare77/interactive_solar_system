import { useSceneFrame } from './useSceneFrame';
/**
 * 3D Solar System Simulator — Real NASA Moon Body Component
 * Features authentic Apollo/LRO photographic lunar imagery, crater relief bump mapping,
 * distinct Galilean moon textures, and irregular potato-shaped geometry for Phobos/Deimos.
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

import { Html } from '@react-three/drei';
import { CelestialBody } from '../../astronomy/types';
import { calculateMoonSpinAxis, getDaysSinceJ2000 } from '../../astronomy/kepler';
import { CELESTIAL_BODY_MAP } from '../../astronomy/celestialData';
import { scaleRadius } from '../../astronomy/scaling';
import { useSimulation } from '../../state/simulationContext';
import { loadPlanetTexture, restoreDataTextureRoles } from '../../textures/textureLoader';
import { getCelestialBumpMap } from '../../textures/proceduralTextures';
import { AtmosphereGlow } from './AtmosphereGlow';

interface MoonBodyProps {
  moon: CelestialBody;
  parentVisualRadius: number;
}

export const MoonBody: React.FC<MoonBodyProps> = ({ moon, parentVisualRadius }) => {
  const {
    getSimulationDate,
    getBodyPosition,
    scaleMode,
    selectedBodyId,
    selectBody,
    hoveredBodyId,
    setHoveredBodyId,
  } = useSimulation();

  const moonGroupRef = useRef<THREE.Group>(null);
  const moonMeshRef = useRef<THREE.Mesh>(null);
  const spinPole = useMemo(() => {
    const parentTilt = CELESTIAL_BODY_MAP.get(moon.parentId ?? '')?.physical.axialTiltDeg ?? 0;
    const axis = moon.moonOrbitalElements ? calculateMoonSpinAxis(moon.moonOrbitalElements,parentTilt) : {x:0,y:1,z:0};
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(axis.x,axis.y,axis.z));
  },[moon]);

  // Calibrated moon radius by ID
  const radius = scaleRadius(moon.physical.radiusKm, 'moon', scaleMode, moon.id);

  // Dedicated texture per moon (Apollo photographic map for Moon, dedicated procedural map for Io, Europa, Ganymede, Titan, etc.)
  const texture = useMemo(() => {
    return loadPlanetTexture(`${moon.id}.jpg`, moon.textureType);
  }, [moon.id, moon.textureType]);

  const bumpMap = useMemo(() => {
    if (['moon', 'phobos', 'deimos', 'callisto', 'charon'].includes(moon.id)) {
      return getCelestialBumpMap('moon');
    }
    if (['mimas', 'miranda', 'iapetus', 'titania'].includes(moon.id)) {
      return getCelestialBumpMap(moon.id);
    }
    return null;
  }, [moon.id]);

  const isSelected = selectedBodyId === moon.id;
  const isHovered = hoveredBodyId === moon.id;
  const isParentSelected = selectedBodyId === moon.parentId;

  // Triaxial ellipsoid scaling for captured asteroid moons (Phobos & Deimos)
  const geometryScale: [number, number, number] = useMemo(() => {
    if (moon.id === 'phobos') return [1.45, 1.0, 0.8]; // Distinct irregular potato asteroid
    if (moon.id === 'deimos') return [1.3, 1.0, 0.85];
    return [1.0, 1.0, 1.0];
  }, [moon.id]);

  const reticleRef = useRef<THREE.Group>(null);

  // Calculate current moon position relative to parent planet
  useSceneFrame(({ camera }) => {
    if (!moon.moonOrbitalElements || !moonGroupRef.current) return;

    const scaledOffset = getBodyPosition(moon.id,scaleMode)?.displayOffset;
    if (!scaledOffset) return;

    moonGroupRef.current.position.set(scaledOffset.x, scaledOffset.y, scaledOffset.z);

    // Synchronous or sidereal rotation
    if (moonMeshRef.current && moon.physical.rotationPeriodHours) {
      const rotSpeed = 24 / Math.abs(moon.physical.rotationPeriodHours);
      moonMeshRef.current.quaternion.copy(spinPole);
      moonMeshRef.current.rotateY(getDaysSinceJ2000(getSimulationDate()) * rotSpeed * Math.PI * 2);
    }

    if (reticleRef.current) {
      reticleRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const showLabel = isSelected || isHovered || isParentSelected;

  return (
    <group ref={moonGroupRef}>
      <mesh
        ref={moonMeshRef}
        scale={geometryScale}
        onClick={(e) => {
          e.stopPropagation();
          selectBody(moon.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredBodyId(moon.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredBodyId(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          onUpdate={restoreDataTextureRoles}
          map={texture}
          color="#ffffff"
          bumpMap={bumpMap || undefined}
          bumpScale={bumpMap ? radius * 0.025 : 0}
          roughness={moon.id === 'enceladus' ? 0.2 : 0.88}
          metalness={0.04}
        />
      </mesh>

      {/* Atmospheric Rayleigh haze for Titan */}
      {moon.hasAtmosphere && moon.atmosphereColor && (
        <AtmosphereGlow
          radius={radius}
          color={moon.atmosphereColor}
          intensity={1.25}
          power={3.2}
        />
      )}

      {/* Camera-Facing Target HUD Indicator */}
      {isSelected && (
        <group ref={reticleRef}>
          <mesh>
            <ringGeometry args={[radius * 1.3, radius * 1.34, 32]} />
            <meshBasicMaterial
              color="#38bdf8"
              side={THREE.DoubleSide}
              transparent
              opacity={0.4}
            />
          </mesh>
        </group>
      )}

      {/* Contextual Label */}
      {showLabel && (
        <Html
          position={[0, radius + 0.4, 0]}
          center
          zIndexRange={[1, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap transition-all shadow-md ${
                isSelected
                  ? 'bg-sky-500 text-black font-semibold ring-1 ring-white'
                  : 'bg-black/85 text-zinc-300 border border-zinc-700/80 backdrop-blur-sm'
              }`}
            >
              🌑 {moon.name}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
