import { useThree } from '@react-three/fiber';
import { nearestProjectedMarker } from '../../astronomy/markerPicking';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { scaleRadius } from '../../astronomy/scaling';
import { MOONS, CELESTIAL_BODIES } from '../../astronomy/celestialData';
import { useSimulation } from '../../state/simulationContext';
import { useSceneFrame } from './useSceneFrame';
/** Small moons remain selectable navigation markers; point size is not a physical measurement. */
export function MoonMarkers({parentId}:{parentId:string}) {
  const {getBodyPosition,scaleMode,selectBody,selectedBodyId,cameraMode}=useSimulation();
  const moons=useMemo(()=>MOONS.filter(moon=>moon.parentId===parentId && !(moon.physical.radiusKm>=100)),[parentId]);
  const {camera,size}=useThree();
  const pointsRef=useRef<THREE.Points>(null);
  const screenPoints=useMemo(()=>new Float32Array(moons.length*3),[moons]);
  const positions=useMemo(()=>new Float32Array(moons.length*3),[moons]);
  const attribute=useRef<THREE.BufferAttribute>(null);
  const parent=CELESTIAL_BODIES.find(body=>body.id===parentId);
  const selectedMoon=moons.some(moon=>moon.id===selectedBodyId) || MOONS.some(moon=>moon.id===selectedBodyId && moon.parentId===parentId);
  const worldPosition=useMemo(()=>new THREE.Vector3(),[]);
  useSceneFrame(()=>{
    const points=pointsRef.current;if(!points || !parent)return;
    points.getWorldPosition(worldPosition);
    const distance=camera.position.distanceTo(worldPosition);
    const angularSize=scaleRadius(parent.physical.radiusKm,parent.type,scaleMode)/Math.max(distance,1e-6);
    const opacity=(cameraMode==='system' && (selectedBodyId===parentId || selectedMoon)) ? THREE.MathUtils.smoothstep(angularSize,0.012,0.04)*0.55 : 0;
    points.visible=opacity>0.01;
    (points.material as THREE.PointsMaterial).opacity=opacity;
    if(!points.visible)return;
    for(let i=0;i<moons.length;i++) {
      const offset=getBodyPosition(moons[i].id,scaleMode)?.displayOffset;
      positions.set(offset && selectedBodyId!==moons[i].id ? [offset.x,offset.y,offset.z] : [1e9,1e9,1e9],i*3);
    }
    if(attribute.current)attribute.current.needsUpdate=true;
  });
  const raycast:THREE.Points['raycast']=(raycaster,intersections)=>{
    const points=pointsRef.current;if(!points || !points.visible)return;
    const cursor=raycaster.ray.at(1,new THREE.Vector3()).project(camera);
    const targetX=(cursor.x+1)*size.width/2,targetY=(1-cursor.y)*size.height/2;
    const world=new THREE.Vector3(),projected=new THREE.Vector3();
    for(let index=0;index<moons.length;index++) {
      world.fromArray(positions,index*3).applyMatrix4(points.matrixWorld);projected.copy(world).project(camera);
      const distance=raycaster.ray.origin.distanceTo(world);
      const visible=projected.z>=-1&&projected.z<=1&&distance>=raycaster.near&&distance<=raycaster.far;
      screenPoints.set(visible?[(projected.x+1)*size.width/2,(1-projected.y)*size.height/2,distance]:[NaN,NaN,0],index*3);
    }
    const index=nearestProjectedMarker(screenPoints,targetX,targetY);
    if(index!==null)intersections.push({distance:screenPoints[index*3+2],point:new THREE.Vector3().fromArray(positions,index*3).applyMatrix4(points.matrixWorld),index,object:points});
  };
  return <points ref={pointsRef} raycast={raycast} frustumCulled={false} onClick={event=>{event.stopPropagation();if(event.index!==undefined)selectBody(moons[event.index].id);}}>
    <bufferGeometry><bufferAttribute ref={attribute} attach="attributes-position" args={[positions,3]}/></bufferGeometry>
    <pointsMaterial size={1.5} sizeAttenuation={false} color="#bbc7d9" transparent opacity={0.7} depthWrite={false} alphaTest={0.01}
      onBeforeCompile={shader=>{
        shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
          'diffuseColor.a *= 1.0 - smoothstep(0.15, 0.5, length(gl_PointCoord - vec2(0.5)));\n#include <opaque_fragment>');
      }}/>

  </points>;
}
