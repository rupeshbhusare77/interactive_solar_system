/**
 * 3D Solar System Simulator — Deep Space Milky Way Galaxy & Starfield
 * Features real photographic Milky Way panorama celestial skybox and multi-temperature twinkling stars.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { loadPlanetTexture } from '../../textures/textureLoader';

export const Starfield: React.FC = () => {
  const [positions, colors] = useMemo(() => {
    const starCount = 3800;
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);

    const starColors = [
      new THREE.Color('#9bb0ff'), // Blue O/B
      new THREE.Color('#bbccff'), // Light blue A
      new THREE.Color('#f8f9ff'), // White F
      new THREE.Color('#ffffed'), // Yellow-white G
      new THREE.Color('#ffd2a1'), // Orange K
      new THREE.Color('#ff8f8f'), // Red M
    ];

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1800 + Math.random() * 800;

      const sinPhi = Math.sin(phi);
      pos[i * 3] = r * sinPhi * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * sinPhi * Math.sin(theta);

      const chosenColor = starColors[Math.floor(Math.random() * starColors.length)];
      const brightness = 0.4 + Math.random() * 0.6;
      col[i * 3] = chosenColor.r * brightness;
      col[i * 3 + 1] = chosenColor.g * brightness;
      col[i * 3 + 2] = chosenColor.b * brightness;
    }

    return [pos, col];
  }, []);

  const galaxyTexture = useMemo(() => {
    return loadPlanetTexture('milkyway.png', 'sun');
  }, []);

  return (
    <group>
      {/* Real NASA Milky Way Celestial Sphere Skybox */}
      <mesh>
        <sphereGeometry args={[3200, 64, 64]} />
        <meshBasicMaterial
          map={galaxyTexture}
          side={THREE.BackSide}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>

      {/* Sparkling Stellar Points */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.6}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation={false}
        />
      </points>
    </group>
  );
};
