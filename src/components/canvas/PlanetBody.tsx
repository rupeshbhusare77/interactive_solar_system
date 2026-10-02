/**
 * 3D Solar System Simulator — Photorealistic Planetary Renderer
 * Employs official high-resolution NASA/JPL photographic maps, elevation bump maps,
 * specular ocean reflectivity, dynamic cloud decks, night city lights, and Rayleigh atmospheric scattering.
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CelestialBody } from '../../astronomy/types';
import { scaleRadius, scaleRingSystem } from '../../astronomy/scaling';
import { MOONS } from '../../astronomy/celestialData';
import { useSimulation } from '../../state/simulationContext';
import {
  loadPlanetTexture,
  loadPlanetBumpMap,
  loadRingTexture,
} from '../../textures/textureLoader';
import { AtmosphereGlow } from './AtmosphereGlow';
import { MoonBody } from './MoonBody';
import { PlanetaryRings, RingShadowOnPlanet } from './PlanetaryRings';
import { EarthNightLights } from './EarthNightLights';

interface PlanetBodyProps {
  body: CelestialBody;
}

export const PlanetBody: React.FC<PlanetBodyProps> = ({ body }) => {
  const {
    getBodyEphemeris,
    getBodyPosition,
    scaleMode,
    selectedBodyId,
    selectBody,
    hoveredBodyId,
    setHoveredBodyId,
    viewToggles,
  } = useSimulation();

  const planetGroupRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);
  const surfaceMeshRef = useRef<THREE.Mesh>(null);
  const cloudsMeshRef = useRef<THREE.Mesh>(null);

  // Pass body.id so educational radius calibration is applied
  const radius = scaleRadius(body.physical.radiusKm, body.type, scaleMode, body.id);

  // Load official high-res NASA maps with procedural fallback
  const texture = useMemo(() => {
    return loadPlanetTexture(`${body.id}.jpg`, body.textureType);
  }, [body.id, body.textureType]);

  const bumpMap = useMemo(() => {
    if (['earth', 'mars', 'mercury', 'venus', 'ceres', 'pluto'].includes(body.id)) {
      const filename = body.id === 'earth' ? 'earth_normal.jpg' : `${body.id}_bump.jpg`;
      return loadPlanetBumpMap(filename, body.textureType);
    }
    return null;
  }, [body.id, body.textureType]);

  const roughnessMap = useMemo(() => {
    if (body.id === 'earth') {
      return loadPlanetTexture('earth_specular.jpg', 'earth');
    }
    return null;
  }, [body.id]);

  const nightLightsTexture = useMemo(() => {
    if (body.id === 'earth') {
      return loadPlanetTexture('earth_lights.png', 'earth-night');
    }
    return null;
  }, [body.id]);

  const cloudsTexture = useMemo(() => {
    if (body.hasClouds) {
      return loadPlanetTexture('earth_clouds.png', 'earth-clouds');
    }
    return null;
  }, [body.hasClouds]);

  const ringTexture = useMemo(() => {
    if (body.rings) {
      return loadRingTexture(body.id);
    }
    return null;
  }, [body.rings, body.id]);

  // Haumea's famous elongated rugby-ball shape due to 3.9-hour rapid spin
  const geometryScale: [number, number, number] = useMemo(() => {
    if (body.id === 'haumea') return [1.85, 1.0, 0.78];
    return [1.0, 1.0, 1.0];
  }, [body.id]);

  // Child moons
  const childMoons = useMemo(() => {
    return MOONS.filter((moon) => moon.parentId === body.id);
  }, [body.id]);

  const isSelected = selectedBodyId === body.id;
  const isHovered = hoveredBodyId === body.id;

  // Real-time orbital mechanics update
  useFrame(() => {
    if (!body.orbitalElements || !planetGroupRef.current) return;

    const ephemeris = getBodyEphemeris(body.id);
    const scaledPos = getBodyPosition(body.id, scaleMode)?.displayPosition;
    if (!ephemeris || !scaledPos) return;
    planetGroupRef.current.position.set(scaledPos.x, scaledPos.y, scaledPos.z);

    // Spin planet around its axial tilt
    if (surfaceMeshRef.current) {
      const rotRad = THREE.MathUtils.degToRad(ephemeris.rotationAngleDeg);
      surfaceMeshRef.current.rotation.y = rotRad;
    }

    // Spin Earth clouds slightly faster than terrain
    if (cloudsMeshRef.current) {
      const cloudSpeed = THREE.MathUtils.degToRad(ephemeris.rotationAngleDeg * 1.09);
      cloudsMeshRef.current.rotation.y = cloudSpeed;
    }
  });

  // Calculate rings dimensions
  const ringsGeometryArgs = useMemo(() => {
    if (!body.rings) return null;
    const { innerRadius, outerRadius } = scaleRingSystem(
      body.rings.innerRadiusKm,
      body.rings.outerRadiusKm,
      radius,
      body.physical.radiusKm,
      scaleMode
    );
    return { innerRadius, outerRadius };
  }, [body.rings, radius, body.physical.radiusKm, scaleMode]);

  const axialTiltRad = THREE.MathUtils.degToRad(body.physical.axialTiltDeg);

  return (
    <group ref={planetGroupRef}>
      {/* Tilted along polar spin axis */}
      <group ref={spinGroupRef} rotation={[axialTiltRad, 0, 0]}>
        {/* Planet Surface Sphere */}
        <mesh
          ref={surfaceMeshRef}
          scale={geometryScale}
          onClick={(e) => {
            e.stopPropagation();
            selectBody(body.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredBodyId(body.id);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHoveredBodyId(null);
            document.body.style.cursor = 'auto';
          }}
        >
          <sphereGeometry args={[radius, 64, 64]} />
          <meshStandardMaterial
            map={texture}
            color="#ffffff"
            bumpMap={bumpMap || undefined}
            bumpScale={bumpMap ? (body.id === 'earth' ? 0.05 : 0.04) : 0}
            roughnessMap={roughnessMap || undefined}
            roughness={body.id === 'earth' ? 0.75 : 0.78}
            metalness={0.04}
            emissive={new THREE.Color(0x000000)}
            emissiveIntensity={0}
          />
        </mesh>

        {/* Authentic Night-Side City Lights (Only illuminates across the dark hemisphere of Earth) */}
        {body.id === 'earth' && nightLightsTexture && (
          <EarthNightLights
            radius={radius}
            nightTexture={nightLightsTexture}
            spinGroupRef={spinGroupRef}
          />
        )}

        {/* Real-time Ring Shadow projected onto the planetary cloud deck */}
        {body.rings && ringsGeometryArgs && ringTexture && (
          <RingShadowOnPlanet
            innerRadius={ringsGeometryArgs.innerRadius}
            outerRadius={ringsGeometryArgs.outerRadius}
            planetVisualRadius={radius}
            ringTexture={ringTexture}
            spinGroupRef={spinGroupRef}
          />
        )}

        {/* Earth Atmospheric Cloud Deck */}
        {body.hasClouds && cloudsTexture && (
          <mesh ref={cloudsMeshRef}>
            <sphereGeometry args={[radius * 1.022, 64, 64]} />
            <meshStandardMaterial
              map={cloudsTexture}
              transparent
              opacity={0.8}
              blending={THREE.NormalBlending}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Photorealistic Atmospheric Rayleigh Scattering Glow */}
        {body.hasAtmosphere && body.atmosphereColor && (
          <AtmosphereGlow
            radius={radius}
            color={body.atmosphereColor}
            intensity={body.id === 'earth' ? 1.4 : body.id === 'venus' ? 1.3 : 1.1}
            power={body.id === 'earth' ? 2.5 : 2.2}
          />
        )}

        {/* Photorealistic High-Fidelity Ring System with Planetary Shadow & Optical Scattering */}
        {body.rings && ringsGeometryArgs && ringTexture && (
          <PlanetaryRings
            planetId={body.id}
            innerRadius={ringsGeometryArgs.innerRadius}
            outerRadius={ringsGeometryArgs.outerRadius}
            planetVisualRadius={radius}
            ringTexture={ringTexture}
            opacity={body.rings.opacity}
            ringColor={body.rings.color || '#ffffff'}
            planetWorldGroupRef={planetGroupRef}
          />
        )}
      </group>

      {/* Child Moons */}
      {viewToggles.showMoons &&
        childMoons.map((moon) => (
          <MoonBody
            key={moon.id}
            moon={moon}
            parentVisualRadius={radius}
          />
        ))}

      {/* Selection Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.35, radius * 1.45, 64]} />
          <meshBasicMaterial
            color="#38bdf8"
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Contextual Planet Label */}
      {(viewToggles.showLabels || isHovered || isSelected) && (
        <Html
          position={[0, radius + 1.2, 0]}
          center
          zIndexRange={[1, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center">
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold tracking-wide transition-all shadow-lg ${
                isSelected
                  ? 'bg-sky-500 text-black shadow-glow-cyan font-bold ring-1 ring-white'
                  : 'bg-black/80 text-white border border-white/20'
              }`}
            >
              {body.name}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
