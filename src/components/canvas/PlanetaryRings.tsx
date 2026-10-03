import { useSceneFrame } from './useSceneFrame';
/**
 * 3D Solar System Simulator — Precision Planetary Ring & Shadow System
 * Features:
 * 1. Real-time spherical planet shadow projection across the rings (curved dark crescent behind planet).
 * 2. Real-time ring shadow projection onto the planetary cloud deck (dark horizontal striped shadow bands).
 * 3. Forward & backward optical phase scattering through billions of icy particles (luminous back-lighting).
 * 4. 4096-sample ultra-detailed radial density profile for Saturn, Uranus, and Haumea.
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';


interface PlanetaryRingsProps {
  planetId: string;
  innerRadius: number;
  outerRadius: number;
  planetVisualRadius: number;
  ringTexture: THREE.Texture;
  ringDensity: THREE.Texture;
  opacity?: number;
  ringColor?: string;
  planetWorldGroupRef: React.RefObject<THREE.Group>;
}

interface RingShadowOnPlanetProps {
  innerRadius: number;
  outerRadius: number;
  planetVisualRadius: number;
  ringDensity: THREE.Texture;
  spinGroupRef: React.RefObject<THREE.Group>;
}

const RING_VERTEX_SHADER = `
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;
varying vec3 vNormal;

void main() {
  vLocalPosition = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const RING_FRAGMENT_SHADER = `
uniform sampler2D uRingTexture;
uniform sampler2D uRingDensity;
uniform vec3 uSunPosition; // World position of the Sun = (0, 0, 0)
uniform vec3 uPlanetWorldPos;
uniform float uPlanetRadius;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uOpacity;
uniform vec3 uRingColor;
uniform bool uIsSaturn;

varying vec3 vWorldPosition;
varying vec3 vLocalPosition;
varying vec3 vNormal;

void main() {
  // Radial normalized coordinate from inner to outer edge
  float r = length(vLocalPosition.xy);
  float normR = clamp((r - uInnerRadius) / (uOuterRadius - uInnerRadius), 0.0, 1.0);

  vec4 texColor = texture2D(uRingTexture, vec2(normR, 0.5));
  float density = texture2D(uRingDensity, vec2(normR, 0.5)).r;
  if (density < 0.015) discard;

  // 1. Direction vector from ring point toward the Sun
  vec3 sunDir = normalize(uSunPosition - vWorldPosition);

  // 2. Direction vector from ring point to camera
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // 3. Real-Time Planet Spherical Shadow on the Rings:
  // Ray from ring point toward the Sun: R(t) = vWorldPosition + t * sunDir (t > 0)
  vec3 toPlanet = uPlanetWorldPos - vWorldPosition;
  float t = dot(toPlanet, sunDir);
  float shadowFactor = 1.0;

  if (t > 0.0) {
    vec3 closestPointOnRay = vWorldPosition + t * sunDir;
    float distToPlanetCenter = length(closestPointOnRay - uPlanetWorldPos);

    // Soft penumbra transition at planetary limb
    float penumbra = uPlanetRadius * 0.038;
    float shadow = smoothstep(uPlanetRadius - penumbra, uPlanetRadius + penumbra, distToPlanetCenter);
    shadowFactor = shadow;
  }

  // 4. Optical Phase Function & Ice Particle Lighting:
  float nDotL = abs(dot(vNormal, sunDir));
  float cosPhase = dot(sunDir, viewDir);

  // Back-scatter (reflection toward Sun): illuminates dense B-ring
  float backScatter = pow(max(0.0, -cosPhase), 2.5) * 0.52;

  // Forward-scatter (transmission through icy particles): illuminates C-ring & Cassini division
  float forwardScatter = pow(max(0.0, cosPhase), 3.5) * 0.68;

  // Total lighting intensity
  float lighting = 0.20 + 0.80 * nDotL + backScatter + forwardScatter * (1.0 - density * 0.45);

  // Apply dark planet shadow (shadowed side retains a faint 3% ambient space illumination)
  lighting = mix(0.03, lighting, shadowFactor);

  vec3 finalColor = texColor.rgb * uRingColor * lighting;
  float finalAlpha = density * uOpacity;

  gl_FragColor = vec4(finalColor, finalAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const PLANET_SHADOW_VERTEX = `
varying vec3 vLocalPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vLocalPosition = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const PLANET_SHADOW_FRAGMENT = `
uniform sampler2D uRingTexture;
uniform sampler2D uRingDensity;
uniform vec3 uLocalSunDir;
uniform vec3 uSunPosition;
uniform float uInnerRadius;
uniform float uOuterRadius;

varying vec3 vLocalPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  // Verify surface point is on the sunlit hemisphere
  vec3 worldSunDir = normalize(uSunPosition - vWorldPosition);
  float nDotL = dot(vWorldNormal, worldSunDir);
  if (nDotL <= 0.0) discard;

  // Ray from surface point along sun direction in local ring coordinate space (ring lies in X-Z plane, Y=0):
  // P(t) = vLocalPosition + t * uLocalSunDir
  // Ring plane intersection: vLocalPosition.y + t * uLocalSunDir.y = 0 => t = -vLocalPosition.y / uLocalSunDir.y
  if (abs(uLocalSunDir.y) < 0.001) discard;

  float t = -vLocalPosition.y / uLocalSunDir.y;
  if (t > 0.0) {
    vec2 hitXZ = vLocalPosition.xz + t * uLocalSunDir.xz;
    float hitR = length(hitXZ);

    if (hitR >= uInnerRadius && hitR <= uOuterRadius) {
      float normR = clamp((hitR - uInnerRadius) / (uOuterRadius - uInnerRadius), 0.0, 1.0);
      float density = texture2D(uRingDensity, vec2(normR, 0.5)).r;

      // Crisp ring shadow projected onto cloud deck with penumbra attenuation
      float shadowOpacity = density * 0.85 * smoothstep(0.0, 0.15, nDotL);
      gl_FragColor = vec4(0.03, 0.02, 0.01, shadowOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      return;
    }
  }

  discard;
}
`;

/**
 * Photorealistic Planetary Rings with dynamic shadow projection
 */
export const PlanetaryRings: React.FC<PlanetaryRingsProps> = ({
  planetId,
  innerRadius,
  outerRadius,
  planetVisualRadius,
  ringTexture,
  ringDensity,
  opacity = 0.9,
  ringColor = '#ffffff',
  planetWorldGroupRef,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uRingTexture: { value: ringTexture },
      uRingDensity: { value: ringDensity },
      uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
      uPlanetWorldPos: { value: new THREE.Vector3(0, 0, 0) },
      uPlanetRadius: { value: planetVisualRadius },
      uInnerRadius: { value: innerRadius },
      uOuterRadius: { value: outerRadius },
      uOpacity: { value: opacity },
      uRingColor: { value: new THREE.Color(ringColor) },
      uIsSaturn: { value: planetId === 'saturn' },
    }),
    [ringTexture, ringDensity, planetVisualRadius, innerRadius, outerRadius, opacity, ringColor, planetId]
  );


  useSceneFrame(() => {
    if (!materialRef.current || !planetWorldGroupRef.current) return;

    const planetWorldPos = new THREE.Vector3();
    planetWorldGroupRef.current.getWorldPosition(planetWorldPos);

    materialRef.current.uniforms.uPlanetWorldPos.value.copy(planetWorldPos);
    materialRef.current.uniforms.uPlanetRadius.value = planetVisualRadius;
    materialRef.current.uniforms.uInnerRadius.value = innerRadius;
    materialRef.current.uniforms.uOuterRadius.value = outerRadius;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[innerRadius, outerRadius, 256, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={RING_VERTEX_SHADER}
        fragmentShader={RING_FRAGMENT_SHADER}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};

/**
 * Projects the dark shadow of the rings directly across the planet's cloud deck
 */
export const RingShadowOnPlanet: React.FC<RingShadowOnPlanetProps> = ({
  innerRadius,
  outerRadius,
  planetVisualRadius,
  ringDensity,
  spinGroupRef,
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uRingDensity: { value: ringDensity },
      uLocalSunDir: { value: new THREE.Vector3(0, 0.4, 0.9).normalize() },
      uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
      uInnerRadius: { value: innerRadius },
      uOuterRadius: { value: outerRadius },
    }),
    [ringDensity, innerRadius, outerRadius]
  );

  useSceneFrame(() => {
    if (!materialRef.current || !spinGroupRef.current) return;

    const planetWorldPos = new THREE.Vector3();
    spinGroupRef.current.getWorldPosition(planetWorldPos);

    // Vector pointing towards the Sun at (0, 0, 0)
    const worldSunDir = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), planetWorldPos).normalize();

    // Transform worldSunDir into the local coordinate system of the tilted spin group
    const invMatrix = new THREE.Matrix4().copy(spinGroupRef.current.matrixWorld).invert();
    const localSunDir = worldSunDir.clone().transformDirection(invMatrix).normalize();

    materialRef.current.uniforms.uLocalSunDir.value.copy(localSunDir);
    materialRef.current.uniforms.uInnerRadius.value = innerRadius;
    materialRef.current.uniforms.uOuterRadius.value = outerRadius;
  });

  return (
    <mesh>
      <sphereGeometry args={[planetVisualRadius * 1.002, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={PLANET_SHADOW_VERTEX}
        fragmentShader={PLANET_SHADOW_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};
