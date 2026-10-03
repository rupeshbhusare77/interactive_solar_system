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
  const { scaleMode, selectedBodyId, selectBody, setHoveredBodyId, viewToggles, getSimulationDate } =
    useSimulation();
  const sunMeshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const reticleRef = useRef<THREE.Group>(null);

  const radius = scaleRadius(SUN.physical.radiusKm, 'star', scaleMode, 'sun');
  // Legacy solar map; source status is recorded in ASSET_SOURCES.md.
  const texture = useMemo(() => loadPlanetTexture('sun.jpg', 'sun'), []);

  const surfaceUniforms = useMemo(() => ({ surfaceMap: { value: texture } }), [texture]);
  const isSelected = selectedBodyId === 'sun';


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
        <sphereGeometry args={[radius, 96, 64]} />
        <shaderMaterial
          uniforms={surfaceUniforms}
          vertexShader={`
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
              vUv = uv;
              vNormal = normalMatrix * normal;
              vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
              vViewPosition = -viewPosition.xyz;
              gl_Position = projectionMatrix * viewPosition;
            }`}
          fragmentShader={`
            uniform sampler2D surfaceMap;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
              vec3 mapColor = texture2D(surfaceMap, vUv).rgb;
              float detail = dot(mapColor, vec3(0.2126, 0.7152, 0.0722));
              float mu = clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0);
              // Approximate visible-light limb darkening, not a calibrated solar spectrum.
              float limb = 0.4 + 0.6 * mu;
              vec3 warmth = mix(vec3(1.0, 0.26, 0.035), vec3(1.0, 0.48, 0.09), sqrt(mu));
              gl_FragColor = vec4(warmth * pow(detail, 1.65) * limb * 1.25, 1.0);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }`}
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
              float halo=(0.18*exp(-outside*26.0)+0.035*exp(-outside*7.0))
                *(1.0-smoothstep(0.6,1.0,r))*smoothstep(0.38,0.405,r);
              gl_FragColor=vec4(1.0,0.88,0.65,halo);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }`}
        />
      </mesh>

      {/* Camera-Facing Target Halo */}
      {isSelected && (
        <group ref={reticleRef}>
          <mesh>
            <ringGeometry args={[radius * 1.35, radius * 1.356, 128]} />
            <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.3} />
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
