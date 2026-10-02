/**
 * 3D Solar System Simulator — Precision Camera Manager
 * Implements Free, Focus, Follow, Top View, and Ecliptic View camera dynamics
 * with support for planets, dwarf planets, comets, and moon-parent hierarchical tracking.
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import { useSimulation } from '../../state/simulationContext';
import { CELESTIAL_BODY_MAP } from '../../astronomy/celestialData';
import { resolveBodyPosition } from '../../astronomy/kepler';
import { scaleRadius } from '../../astronomy/scaling';

export const CameraManager: React.FC = () => {
  const { cameraMode, selectedBodyId, simulationDate, scaleMode } = useSimulation();
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const followOffset = useRef(new THREE.Vector3(0, 8, 16));
  const isTransitioningRef = useRef(false);

  const selectedBody = selectedBodyId ? CELESTIAL_BODY_MAP.get(selectedBodyId) : null;

  // React to Camera Mode switches and selected body changes
  useEffect(() => {
    if (!controlsRef.current) return;

    if (cameraMode === 'top') {
      // Top-down bird's eye view
      camera.position.set(0, 320, 0.01);
      controlsRef.current.target.set(0, 0, 0);
      isTransitioningRef.current = false;
    } else if (cameraMode === 'ecliptic') {
      // Edge-on view to observe inclinations
      camera.position.set(0, 2, 280);
      controlsRef.current.target.set(0, 0, 0);
      isTransitioningRef.current = false;
    } else if (selectedBody) {
      // Calculate framing distance based on calibrated educational radius
      const radius = scaleRadius(
        selectedBody.physical.radiusKm,
        selectedBody.type,
        scaleMode,
        selectedBody.id
      );

      // Distance ratio tuned so planet/moon fills ~30% of screen height
      const dist = scaleMode === 'real' ? Math.max(radius * 3.5, 0.001) : Math.max(radius * 3.6, 2.2);
      followOffset.current.set(dist * 0.7, dist * 0.35, dist);
      isTransitioningRef.current = true;
    }
  }, [cameraMode, selectedBodyId, scaleMode, camera, selectedBody]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (cameraMode === 'focus' || cameraMode === 'follow') {
      const resolved = selectedBody ? resolveBodyPosition(selectedBody.id,simulationDate,scaleMode) : null;
      if (!resolved) return;
      const bodyPos = new THREE.Vector3(resolved.displayPosition.x,resolved.displayPosition.y,resolved.displayPosition.z);

      // Smooth tracking of lookAt target
      currentTarget.current.lerp(bodyPos, Math.min(1.0, delta * 7));
      controlsRef.current.target.copy(currentTarget.current);

      const targetCamPos = bodyPos.clone().add(followOffset.current);

      if (cameraMode === 'follow') {
        // Continuous lock on body position as it speeds along its orbit
        camera.position.lerp(targetCamPos, Math.min(1.0, delta * 5));
      } else if (cameraMode === 'focus' && isTransitioningRef.current) {
        // Smooth flight animation to bring planet close to camera
        camera.position.lerp(targetCamPos, Math.min(1.0, delta * 4));

        const radius = selectedBody
          ? scaleRadius(selectedBody.physical.radiusKm, selectedBody.type, scaleMode, selectedBody.id)
          : 1.0;
        const threshold = Math.max(radius * 0.15, 0.0005);

        if (camera.position.distanceTo(targetCamPos) < threshold) {
          isTransitioningRef.current = false;
        }
      }
    }

    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={0.0005}
      maxDistance={100000}
      zoomSpeed={1.2}
      rotateSpeed={0.8}
    />
  );
};
