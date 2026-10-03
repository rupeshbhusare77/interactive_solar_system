import { useSceneFrame } from './useSceneFrame';
/** Solar disk and a soft photographic-style halo; the glow is illustrative. */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

import { Html } from '@react-three/drei';
import { SUN } from '../../astronomy/celestialData';
import { scaleRadius } from '../../astronomy/scaling';
import { useSimulation } from '../../state/simulationContext';
import { loadPlanetTexture } from '../../textures/textureLoader';

export const SunBody: React.FC = () => {
  const { scaleMode, selectedBodyId, selectBody, hoveredBodyId, setHoveredBodyId, viewToggles, getSimulationDate } =
    useSimulation();
  const sunMeshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const reticleRef = useRef<THREE.Group>(null);

  const radius = scaleRadius(SUN.physical.radiusKm, 'star', scaleMode, 'sun');
  // Legacy solar map; source status is recorded in ASSET_SOURCES.md.
  const texture = useMemo(() => loadPlanetTexture('sun.jpg', 'sun'), []);

  const isSelected = selectedBodyId === 'sun';
  const isHovered = hoveredBodyId === 'sun';

  useSceneFrame(({ camera }) => {
    if (sunMeshRef.current) {
      // The visual map uses a single approximate equatorial rotation period.
      sunMeshRef.current.rotation.y = (getSimulationDate().getTime() / 86400000 / 25.38 % 1) * Math.PI * 2;
    }
    glowRef.current?.quaternion.copy(camera.quaternion);
    reticleRef.current?.quaternion.copy(camera.quaternion);
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Primary Solar Illuminator: Lights all planets & moons */}
      <pointLight
        position={[0, 0, 0]}
        intensity={viewToggles.showLighting ? 3 : 0}
        distance={0}
        decay={0}
        color="#ffffff"
      />

      <group>
      {/* Photosphere Sphere */}
      <mesh
        ref={sunMeshRef}
        onClick={(e) => {
          e.stopPropagation();
          selectBody('sun');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredBodyId('sun');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredBodyId(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          map={texture}
          color="#ffffff"
        />
      </mesh>

      {/* A continuous radial falloff avoids visible concentric shell boundaries. */}
      <mesh ref={glowRef} scale={[radius * 5, radius * 5, 1]} raycast={() => {}}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          transparent depthWrite={false} blending={THREE.AdditiveBlending}
          vertexShader={`varying vec2 vUv;
            void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
          fragmentShader={`varying vec2 vUv;
            void main(){
              float r=length(vUv-0.5)*2.0;
              float outside=max(0.0,r-0.4);
              float halo=exp(-outside*18.0)*(1.0-smoothstep(0.4,1.0,r))*smoothstep(0.37,0.42,r);
              gl_FragColor=vec4(1.0,0.72,0.36,halo*0.24);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }`}
        />
      </mesh>

      {/* Camera-Facing Target Halo */}
      {isSelected && (
        <group ref={reticleRef}>
          <mesh>
            <ringGeometry args={[radius * 1.35, radius * 1.38, 64]} />
            <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.4} />
          </mesh>
        </group>
      )}

      {/* Label / Billboard */}
      {viewToggles.showLabels && (
        <Html
          position={[0, radius + 1.8, 0]}
          center
          zIndexRange={[1, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center">
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold tracking-wider uppercase transition-all ${
                isSelected
                  ? 'bg-amber-400 text-black shadow-glow-gold ring-1 ring-white'
                  : 'bg-black/80 text-amber-300 border border-amber-500/50 backdrop-blur-sm'
              }`}
            >
              Sun
            </span>
          </div>
        </Html>
      )}
      </group>
    </group>
  );
};
