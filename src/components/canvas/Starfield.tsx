/** Photographic all-sky panorama. Credit: ESO/S. Brunier (CC BY 4.0). */
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useSceneFrame } from './useSceneFrame';
import { loadPlanetTexture } from '../../textures/textureLoader';

export const Starfield: React.FC = () => {
  const skyRef = useRef<THREE.Group>(null);
  const galaxyTexture = useMemo(() => loadPlanetTexture('milkyway-eso.jpg', 'sun'), []);
  useSceneFrame(({ camera }) => {
    if (!skyRef.current) return;
    skyRef.current.position.copy(camera.position);
    skyRef.current.scale.setScalar(camera.far * 0.45 / 3200);
  });

  return (
    <group ref={skyRef} name="background-sky">
      {/* Static photographic backdrop; orientation is not an astrometric solution. */}
      <mesh renderOrder={-1000} frustumCulled={false} rotation={[0, 0, Math.PI / 3]}>
        <sphereGeometry args={[3200, 256, 128]} />
        <meshBasicMaterial
          map={galaxyTexture}
          side={THREE.BackSide}
          color={new THREE.Color(0.035, 0.035, 0.035)}
          toneMapped={false}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </group>
  );
};
