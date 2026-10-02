/**
 * 3D Solar System Simulator — Atmospheric Rayleigh Scattering Glow Shader
 * Produces photorealistic atmospheric limb haze (the ethereal blue ring around Earth,
 * amber haze on Venus, and orange tholin glow on Titan) seen from orbit.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface AtmosphereGlowProps {
  radius: number;
  color: string;
  intensity?: number;
  power?: number;
}

export const AtmosphereGlow: React.FC<AtmosphereGlowProps> = ({
  radius,
  color,
  intensity = 1.2,
  power = 2.4,
}) => {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(color) },
        c: { value: 0.28 },
        p: { value: power },
        intensity: { value: intensity },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vPosition = mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float c;
        uniform float p;
        uniform float intensity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float dotNV = dot(vNormal, viewDir);
          float alpha = pow(clamp(c - dotNV, 0.0, 1.0), p) * intensity;
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  }, [color, intensity, power]);

  return (
    <mesh material={material}>
      <sphereGeometry args={[radius * 1.16, 64, 64]} />
    </mesh>
  );
};
