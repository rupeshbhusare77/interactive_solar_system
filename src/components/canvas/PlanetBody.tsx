import { useSceneFrame } from './useSceneFrame';
/** Celestial surface renderer with sourced shapes and explicitly reconstructed appearances. */

import { shapeScale, bodyOrientation } from '../../astronomy/scienceCatalog';
import { dateToJulianDate } from '../../astronomy/kepler';
import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

import { Html } from '@react-three/drei';
import { CelestialBody } from '../../astronomy/types';
import { scaleRadius, scaleRingSystem } from '../../astronomy/scaling';
import { MOONS } from '../../astronomy/celestialData';
import { useSimulation } from '../../state/simulationContext';
import {
  loadPlanetTexture,
  loadPlanetBumpMap,
  loadRingTexture,
  loadRingDensity,
  loadEarthNormalMap,
  loadEarthRoughnessMap,
  restoreDataTextureRoles,
} from '../../textures/textureLoader';
import { AtmosphereGlow } from './AtmosphereGlow';
import { MoonMarkers } from './MoonMarkers';
import { MoonBody } from './MoonBody';
import { PlanetaryRings, RingShadowOnPlanet } from './PlanetaryRings';
import { EarthNightLights } from './EarthNightLights';

interface PlanetBodyProps {
  body: CelestialBody;
}

export const PlanetBody: React.FC<PlanetBodyProps> = ({ body }) => {
  const {
    getSimulationDate,
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
  const surfaceSpinRef = useRef<THREE.Group>(null);
  const cloudsMeshRef = useRef<THREE.Mesh>(null);
  const reticleRef = useRef<THREE.Group>(null);

  // Pass body.id so educational radius calibration is applied
  const radius = scaleRadius(body.physical.radiusKm, body.type, scaleMode, body.id);

  // Load catalog surface maps with an explicitly illustrative fallback.
  const texture = useMemo(() => {
    return loadPlanetTexture(`${body.id}.jpg`, body.textureType);
  }, [body.id, body.textureType]);

  const bumpMap = useMemo(() => {
    if (['mars', 'mercury', 'venus', 'ceres', 'pluto'].includes(body.id)) {
      const filename = `${body.id}_bump.jpg`;
      return loadPlanetBumpMap(filename, body.textureType);
    }
    return null;
  }, [body.id, body.textureType]);

  const roughnessMap = useMemo(() => {
    if (body.id === 'earth') {
      return loadEarthRoughnessMap();
    }
    return null;
  }, [body.id]);

  const normalMap = useMemo(() => body.id === 'earth' ? loadEarthNormalMap() : null, [body.id]);
  const ringDensity = useMemo(() => body.rings ? loadRingDensity(body.id) : null, [body.id, body.rings]);

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
  const geometryScale = useMemo(() => shapeScale(body), [body]);

  // Child moons
  const childMoons = useMemo(() => {
    return MOONS.filter((moon) => moon.parentId === body.id);
  }, [body.id]);

  const isSelected = selectedBodyId === body.id;
  const isHovered = hoveredBodyId === body.id;

  // Real-time orbital mechanics update
  useSceneFrame(({ camera }) => {
    if (!body.orbitalElements || !planetGroupRef.current) return;

    const ephemeris = getBodyEphemeris(body.id);
    const scaledPos = getBodyPosition(body.id, scaleMode)?.displayPosition;
    if (!ephemeris || !scaledPos) return;
    planetGroupRef.current.position.set(scaledPos.x, scaledPos.y, scaledPos.z);

    const orientation=bodyOrientation(body,dateToJulianDate(getSimulationDate()));
    if(orientation && spinGroupRef.current) {
      const pole=new THREE.Vector3(orientation.pole.x,orientation.pole.y,orientation.pole.z);
      const prime=new THREE.Vector3(orientation.prime.x,orientation.prime.y,orientation.prime.z);
      spinGroupRef.current.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(prime,pole,prime.clone().cross(pole)));
    }
    // Spin planet around its sourced pole
    if (surfaceSpinRef.current) {
      const rotRad = THREE.MathUtils.degToRad(ephemeris.rotationAngleDeg);
      surfaceSpinRef.current.rotation.y = orientation ? orientation.meridian : rotRad;
    }

    // Spin Earth clouds slightly faster than terrain
    if (cloudsMeshRef.current) {
      const cloudSpeed = THREE.MathUtils.degToRad(ephemeris.rotationAngleDeg * 1.09);
      cloudsMeshRef.current.rotation.y = cloudSpeed;
    }

    // Align target HUD reticle perpendicular to camera sight line
    if (reticleRef.current) {
      reticleRef.current.quaternion.copy(camera.quaternion);
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
    <group ref={planetGroupRef} name={body.id}>
      {/* Tilted along polar spin axis */}
      <group ref={spinGroupRef} rotation={[axialTiltRad, 0, 0]}>
        {/* Terrain and night lights share one prime meridian and spin transform. */}
        <group ref={surfaceSpinRef}>
        {/* Planet Surface Sphere */}
        <mesh
          ref={surfaceMeshRef} name={`${body.id}-surface`}
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
          <meshPhysicalMaterial
            specularIntensity={body.id === 'earth' ? 0.3 : 1}
            onUpdate={restoreDataTextureRoles}
            map={texture}
            color="#ffffff"
            normalMap={normalMap || undefined}
            normalScale={normalMap ? new THREE.Vector2(0.12, 0.12) : undefined}
            bumpMap={bumpMap || undefined}
            bumpScale={bumpMap ? radius * 0.006 : 0}
            roughnessMap={roughnessMap || undefined}
            roughness={1}
            metalness={0}
            emissive={new THREE.Color(0x000000)}
            emissiveIntensity={0}
          />
        </mesh>

        {/* Authentic Night-Side City Lights (Only illuminates across the dark hemisphere of Earth) */}
        {body.id === 'earth' && nightLightsTexture && (
          <EarthNightLights
            radius={radius}
            nightTexture={nightLightsTexture}
          />
        )}
        </group>

        {/* Real-time Ring Shadow projected onto the planetary cloud deck */}
        {body.rings && ringsGeometryArgs && ringTexture && (
          <RingShadowOnPlanet
            innerRadius={ringsGeometryArgs.innerRadius}
            outerRadius={ringsGeometryArgs.outerRadius}
            planetVisualRadius={radius}
            ringDensity={ringDensity!}
            spinGroupRef={spinGroupRef}
            geometryScale={geometryScale}
          />
        )}

        {/* Earth Atmospheric Cloud Deck */}
        {body.hasClouds && cloudsTexture && (
          <mesh ref={cloudsMeshRef} scale={geometryScale}>
            <sphereGeometry args={[radius * 1.003, 64, 64]} />
            <meshStandardMaterial
              map={cloudsTexture}
              transparent
              opacity={0.78}
              blending={THREE.NormalBlending}
              depthWrite={false}
              roughness={1.0}
            />
          </mesh>
        )}

        {/* Photorealistic Atmospheric Rayleigh Scattering Glow */}
        {body.hasAtmosphere && body.atmosphereColor && (
          <group scale={geometryScale}>
          <AtmosphereGlow
            radius={radius}
            color={body.atmosphereColor}
            intensity={body.id === 'earth' ? 0.55 : body.id === 'venus' ? 0.65 : 0.35}
            power={body.id === 'earth' ? 3.6 : 3.0}
          />
          </group>
        )}

        {/* Photorealistic High-Fidelity Ring System with Planetary Shadow & Optical Scattering */}
        {body.rings && ringsGeometryArgs && ringTexture && (
          <PlanetaryRings
            planetId={body.id}
            innerRadius={ringsGeometryArgs.innerRadius}
            outerRadius={ringsGeometryArgs.outerRadius}
            planetVisualRadius={radius}
            ringTexture={ringTexture}
            ringDensity={ringDensity!}
            opacity={body.rings.opacity}
            ringColor={body.id === 'saturn' ? '#ffffff' : body.rings.color || '#ffffff'}
            planetWorldGroupRef={planetGroupRef}
          />
        )}
      </group>

      {viewToggles.showMoons && <MoonMarkers parentId={body.id} />}
      {/* Child Moons */}
      {viewToggles.showMoons &&
        childMoons.filter(moon=>moon.physical.radiusKm>=100 || selectedBodyId===moon.id).map((moon) => (
          <MoonBody
            key={moon.id}
            moon={moon}
            parentVisualRadius={radius}
          />
        ))}

      {/* Camera-Facing Target HUD Indicator */}
      {isSelected && (
        <group ref={reticleRef}>
          <mesh>
            <ringGeometry args={[radius * 1.25, radius * 1.28, 64]} />
            <meshBasicMaterial
              color="#38bdf8"
              side={THREE.DoubleSide}
              transparent
              opacity={0.35}
            />
          </mesh>
        </group>
      )}

      {/* Contextual Planet Label */}
      {viewToggles.showLabels && (
        <Html
          position={[0, radius + 1.2, 0]}
          center
          zIndexRange={[1, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center">
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold tracking-wide transition-all shadow-lg flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-sky-500 text-black shadow-glow-cyan font-bold ring-1 ring-white'
                  : 'bg-black/80 text-white border border-white/20'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: body.physical.color }}
              />
              <span>{body.name}</span>
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
