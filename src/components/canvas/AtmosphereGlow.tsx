import React, { useMemo } from 'react';
import * as THREE from 'three';

interface AtmosphereGlowProps { radius: number; color: string; intensity?: number; power?: number; }

export const AtmosphereGlow: React.FC<AtmosphereGlowProps> = ({ radius, color, intensity = 1.2, power = 2.4 }) => {
  const uniforms = useMemo(() => ({
    glowColor: { value: new THREE.Color(color) },
    c: { value: 0.28 }, p: { value: power }, intensity: { value: intensity },
  }), [color, intensity, power]);

  return (
    <mesh>
      <sphereGeometry args={[radius * 1.16, 64, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vPosition = mvPos.xyz;
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={`
          uniform vec3 glowColor;
          uniform float c;
          uniform float p;
          uniform float intensity;
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vec3 viewDir = normalize(-vPosition);
            float alpha = pow(clamp(c - dot(vNormal, viewDir), 0.0, 1.0), p) * intensity;
            gl_FragColor = vec4(glowColor, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};
