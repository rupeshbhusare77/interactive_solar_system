import { useSceneFrame } from './useSceneFrame';
/**
 * 3D Solar System Simulator — Comet Body Component
 * Extreme eccentric Keplerian orbits, coma, and dynamic ion/dust tails pointing away from the Sun.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CelestialBody } from '../../astronomy/types';
import { scaleRadius } from '../../astronomy/scaling';
import { useSimulation } from '../../state/simulationContext';

interface CometBodyProps {
  comet: CelestialBody;
}

export const CometBody: React.FC<CometBodyProps> = ({ comet }) => {
  const {
    getBodyEphemeris,
    getBodyPosition,
    scaleMode,
    selectedBodyId,
    selectBody,
    hoveredBodyId,
    setHoveredBodyId,
  } = useSimulation();

  const {camera}=useThree();
  const groupRef = useRef<THREE.Group>(null);
  const tailGroupRef = useRef<THREE.Group>(null);
  const ionTailMeshRef = useRef<THREE.Mesh>(null);
  const comaRef=useRef<THREE.Sprite>(null);
  const dustTailMeshRef = useRef<THREE.Mesh>(null);

  const tailGeometry=useMemo(()=>{
    const geometry=new THREE.PlaneGeometry(1,1,1,32);
    const positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++) {
      const t=positions.getY(i)+0.5;
      positions.setXYZ(i,positions.getX(i)*(0.08+t),0,t);
    }
    geometry.computeBoundingSphere();
    return geometry;
  },[]);
  const tailMaterial=(color:string,curve:number)=>new THREE.ShaderMaterial({
    uniforms:{color:{value:new THREE.Color(color)},opacity:{value:0},curve:{value:curve}},
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    vertexShader:`varying vec2 vUv;uniform float curve;
      void main(){vUv=uv;vec3 p=position;p.x+=curve*p.z*p.z;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader:`varying vec2 vUv;uniform vec3 color;uniform float opacity;
      void main(){float edge=pow(max(0.0,1.0-abs(vUv.x*2.0-1.0)),2.0);
      float fade=pow(1.0-vUv.y,1.8)*smoothstep(0.0,0.06,vUv.y);
      gl_FragColor=vec4(color,opacity*edge*fade);}`,
  });
  const ionMaterial=useMemo(()=>tailMaterial('#80b9d5',0),[]);
  const dustMaterial=useMemo(()=>tailMaterial('#ddd2b5',0.7),[]);
  const comaTexture=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const context=canvas.getContext('2d')!;
    const gradient=context.createRadialGradient(32,32,0,32,32,32);
    gradient.addColorStop(0,'rgba(200,225,218,0.45)');
    gradient.addColorStop(0.25,'rgba(175,210,200,0.12)');
    gradient.addColorStop(1,'rgba(175,210,200,0)');
    context.fillStyle=gradient;context.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(canvas);
  },[]);
  useEffect(()=>()=>{tailGeometry.dispose();ionMaterial.dispose();dustMaterial.dispose();comaTexture.dispose();},[tailGeometry,ionMaterial,dustMaterial,comaTexture]);
  const radius = scaleRadius(comet.physical.radiusKm, 'comet', scaleMode);
  const isSelected = selectedBodyId === comet.id;
  const isHovered = hoveredBodyId === comet.id;

  useSceneFrame(() => {
    if (!comet.orbitalElements || !groupRef.current) return;

    // Ephemeris at current simulation time
    const ephemeris = getBodyEphemeris(comet.id);
    const scaledPos = getBodyPosition(comet.id, scaleMode)?.displayPosition;
    if (!ephemeris || !scaledPos) return;
    groupRef.current.position.set(scaledPos.x, scaledPos.y, scaledPos.z);

    // Orientation of the tail: points away from the Sun (origin [0,0,0])
    if (tailGroupRef.current) {
      const cometPos = new THREE.Vector3(scaledPos.x, scaledPos.y, scaledPos.z);
      const sunDirection = cometPos.clone().normalize();

      // Tail length based on distance to Sun
      const r = ephemeris.distanceAU;
      const activityFactor = Math.max(0, Math.min(1, (3.5 - r) / 3.0));
      if(comaRef.current)(comaRef.current.material as THREE.SpriteMaterial).opacity=activityFactor;
      const tailLength = activityFactor * (scaleMode === 'educational' ? 12.0 : 35.0);

      const targetPoint = cometPos.clone().add(sunDirection.clone().multiplyScalar(tailLength));
      tailGroupRef.current.lookAt(targetPoint);
      // Keep the diffuse tail ribbons facing the observer without changing the anti-solar axis.
      const localView=camera.position.clone().sub(cometPos).applyQuaternion(tailGroupRef.current.quaternion.clone().invert());
      tailGroupRef.current.rotateZ(Math.atan2(-localView.x,localView.y));
      // Illustrative dust curvature follows the projected direction opposite orbital motion.
      const velocity=ephemeris.velocityAUDay;
      const localVelocity=new THREE.Vector3(velocity.x,velocity.y,velocity.z).applyQuaternion(tailGroupRef.current.quaternion.clone().invert());
      dustMaterial.uniforms.curve.value=-Math.sign(localVelocity.x)*0.7;

      if (ionTailMeshRef.current) {
        ionTailMeshRef.current.scale.set(radius*1.8, 1, Math.max(tailLength,0.001));
        ionTailMeshRef.current.position.z = 0;
        ionMaterial.uniforms.opacity.value = activityFactor * 0.22;
      }
      if (dustTailMeshRef.current) {
        dustTailMeshRef.current.scale.set(radius*5, 1, Math.max(tailLength*0.75,0.001));
        dustTailMeshRef.current.position.z = 0;
        dustMaterial.uniforms.opacity.value = activityFactor * 0.16;
      }
    }
  });

  return (
    <group ref={groupRef} name={comet.id}>
      {/* Comet Nucleus */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          selectBody(comet.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredBodyId(comet.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredBodyId(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>

      {/* Diffuse coma without a hard spherical silhouette. */}
      <sprite ref={comaRef} scale={[radius*6,radius*6,1]}>
        <spriteMaterial map={comaTexture} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      {/* Cometary Tail Group */}
      <group ref={tailGroupRef}>
        <mesh ref={ionTailMeshRef} name={`${comet.id}-ion-tail`} geometry={tailGeometry} material={ionMaterial} />
        <mesh ref={dustTailMeshRef} name={`${comet.id}-dust-tail`} geometry={tailGeometry} material={dustMaterial} />
      </group>

      {/* Selection indicator */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 2.5, radius * 2.8, 32]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Decluttered Comet Label (only shown when focused or hovered) */}
      {(isSelected || isHovered) && (
        <Html
          position={[0, radius + 0.6, 0]}
          center
          zIndexRange={[1, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center">
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono whitespace-nowrap shadow-md ${
                isSelected
                  ? 'bg-sky-400 text-black font-semibold ring-1 ring-white'
                  : 'bg-black/85 text-sky-300 border border-sky-500/50 backdrop-blur-sm'
              }`}
            >
              ☄️ {comet.name}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
