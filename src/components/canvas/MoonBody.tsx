import { SURFACE_MAPS } from '../../astronomy/generated/surfaceMaps';
import { useSceneFrame } from './useSceneFrame';
/** Celestial surface renderer with sourced shapes and explicitly reconstructed appearances. */

import { shapeScale, bodyOrientation } from '../../astronomy/scienceCatalog';
import { dateToJulianDate } from '../../astronomy/kepler';
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

  // Load documented mission mosaics where available; other surfaces remain illustrative.
  const texture = useMemo(() => {
    return loadPlanetTexture(`${moon.id}.jpg`, moon.textureType);
  }, [moon.id, moon.textureType]);

  const bumpMap = useMemo(() => {
    if(SURFACE_MAPS.some(map=>map.id===moon.id))return null;
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
  const geometryScale = useMemo(() => shapeScale(moon), [moon]);

  const reticleRef = useRef<THREE.Group>(null);

  // Calculate current moon position relative to parent planet
  useSceneFrame(({ camera }) => {
    if (!moon.moonOrbitalElements || !moonGroupRef.current) return;

    const scaledOffset = getBodyPosition(moon.id,scaleMode)?.displayOffset;
    if (!scaledOffset) return;

    moonGroupRef.current.position.set(scaledOffset.x, scaledOffset.y, scaledOffset.z);

    const orientation=bodyOrientation(moon,dateToJulianDate(getSimulationDate()));
    if(orientation && moonMeshRef.current) {
      const pole=new THREE.Vector3(orientation.pole.x,orientation.pole.y,orientation.pole.z);
      const prime=new THREE.Vector3(orientation.prime.x,orientation.prime.y,orientation.prime.z);
      moonMeshRef.current.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(prime,pole,prime.clone().cross(pole)));
      moonMeshRef.current.rotateY(orientation.meridian);
    }
    // Legacy rotation is only used when no polynomial orientation exists.
    if (!orientation && moon.id!=='hyperion' && moonMeshRef.current && moon.physical.rotationPeriodHours) {
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
          roughness={0.9}
          metalness={0}
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
