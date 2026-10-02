/**
 * 3D Solar System Simulator — Earth Night-Side City Lights Shader
 * Illuminates artificial city lights exclusively across the night hemisphere of Earth,
 * fading smoothly across the twilight atmospheric terminator.
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface EarthNightLightsProps {
  radius: number;
  nightTexture: THREE.Texture;
  spinGroupRef: React.RefObject<THREE.Group>;
}

const NIGHT_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const NIGHT_FRAGMENT_SHADER = `
uniform sampler2D uNightTexture;
uniform vec3 uSunPosition; // World origin (0, 0, 0)

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  // Vector toward the Sun
  vec3 sunDir = normalize(uSunPosition - vWorldPosition);

  // Surface normal relative to sunlight: >0 is day, <0 is night
  float nDotL = dot(vWorldNormal, sunDir);

  // Twilight terminator transition: city lights fade in as darkness falls
  // Starts fading in at dusk (+0.05) and reaches full brightness at night (-0.20)
  float nightFactor = smoothstep(0.05, -0.22, nDotL);
  if (nightFactor <= 0.001) discard;

  vec4 lights = texture2D(uNightTexture, vUv);
  if (lights.r < 0.02) discard;

  // Warm golden-incandescent sodium city light color
  vec3 cityColor = lights.rgb * vec3(1.3, 0.95, 0.55);
  float alpha = lights.r * nightFactor * 0.95;

  gl_FragColor = vec4(cityColor, alpha);
}
`;

export const EarthNightLights: React.FC<EarthNightLightsProps> = ({
  radius,
  nightTexture,
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uNightTexture: { value: nightTexture },
      uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
    }),
    [nightTexture]
  );

  useFrame(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uSunPosition.value.set(0, 0, 0);
  });

  return (
    <mesh>
      <sphereGeometry args={[radius * 1.0015, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={NIGHT_VERTEX_SHADER}
        fragmentShader={NIGHT_FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};
