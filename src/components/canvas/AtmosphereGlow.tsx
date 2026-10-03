/**
 * 3D Solar System Simulator — Atmospheric Rayleigh Scattering Glow Shader
 * Approximates atmospheric limb haze (blue on Earth,
 * amber on Venus, orange tholin haze on Titan) illuminated exclusively on the day side
 * with a soft color transition at the twilight terminator.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface AtmosphereGlowProps {
  radius: number;
  color: string;
  intensity?: number;
  power?: number;
}

const ATMOSPHERE_VERTEX_SHADER = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  vPosition = mvPos.xyz;

  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);

  gl_Position = projectionMatrix * mvPos;
}
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
uniform vec3 uGlowColor;
uniform vec3 uSunPosition; // Heliocentric origin (0, 0, 0)
uniform float uIntensity;
uniform float uPower;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 viewDir = normalize(-vPosition);

  // 1. Fresnel limb scattering: brightest at glancing orbital limb
  float dotNV = max(dot(vNormal, viewDir), 0.0);
  float fresnel = pow(1.0 - dotNV, uPower);

  // 2. Solar illumination: only illuminates the daylight hemisphere
  vec3 sunDir = normalize(uSunPosition - vWorldPosition);
  float sunDot = dot(vWorldNormal, sunDir);

  // Day-to-night fade with soft twilight transition
  float sunFactor = smoothstep(-0.25, 0.4, sunDot);
  if (sunFactor <= 0.001) discard;

  // 3. Twilight Rayleigh sunset reddening along the terminator
  float sunset = (1.0 - smoothstep(-0.05, 0.25, sunDot)) * smoothstep(-0.25, 0.05, sunDot);
  vec3 twilightWarmth = vec3(1.0, 0.62, 0.32);
  vec3 finalColor = mix(uGlowColor, twilightWarmth, sunset * 0.48);

  float alpha = fresnel * sunFactor * uIntensity;
  if (alpha <= 0.002) discard;

  gl_FragColor = vec4(finalColor, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const AtmosphereGlow: React.FC<AtmosphereGlowProps> = ({
  radius,
  color,
  intensity = 1.25,
  power = 3.6,
}) => {

  const uniforms = useMemo(
    () => ({
      uGlowColor: { value: new THREE.Color(color) },
      uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
      uIntensity: { value: intensity },
      uPower: { value: power },
    }),
    [color, intensity, power]
  );


  return (
    <mesh>
      <sphereGeometry args={[radius * 1.012, 64, 64]} />
      <shaderMaterial
        vertexShader={ATMOSPHERE_VERTEX_SHADER}
        fragmentShader={ATMOSPHERE_FRAGMENT_SHADER}
        uniforms={uniforms}
        side={THREE.FrontSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};
