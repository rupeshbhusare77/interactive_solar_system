import { useSceneFrame } from './useSceneFrame';
/**
 * Camera framing follows displayed bounds and the actual viewport, including real-scale moons.
 */
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import { useSimulation } from '../../state/simulationContext';
import { CELESTIAL_BODY_MAP } from '../../astronomy/celestialData';
import { bodyViewRadius, systemViewRadius, fitViewDistance, ViewRegion } from '../../astronomy/viewBounds';

export const CameraManager: React.FC<{ region?: ViewRegion }> = ({ region = 'outer' }) => {
  const { cameraMode, selectedBodyId, getBodyPosition, scaleMode } = useSimulation();
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  const followOffset = useRef(new THREE.Vector3());
  const transitioning = useRef(false);
  const previousBodyPosition = useRef<THREE.Vector3 | null>(null);
  const targetPosition = useMemo(() => new THREE.Vector3(), []);
  const targetCamera = useMemo(() => new THREE.Vector3(), []);
  const selectedBody = selectedBodyId ? CELESTIAL_BODY_MAP.get(selectedBodyId) : null;
  const bodyRadius = selectedBody ? bodyViewRadius(selectedBody, scaleMode) : 1;
  const systemRadius = useMemo(() => systemViewRadius(scaleMode, region), [scaleMode, region]);
  const fullRadius = useMemo(() => systemViewRadius(scaleMode, 'full'), [scaleMode]);

  useEffect(() => {
    if (!controlsRef.current || !(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = size.width / Math.max(1, size.height);
    if (cameraMode === 'top' || cameraMode === 'ecliptic') {
      const distance = fitViewDistance(systemRadius, camera.fov, aspect);
      camera.position.set(0, cameraMode === 'top' ? distance : distance * 0.015,
        cameraMode === 'top' ? distance * 0.001 : distance);
      controlsRef.current.target.set(0, 0, 0);
      transitioning.current = false;
    } else if (selectedBody && (cameraMode === 'focus' || cameraMode === 'follow')) {
      const distance = fitViewDistance(bodyRadius, camera.fov, aspect);
      followOffset.current.set(0.7, 0.35, 1).normalize().multiplyScalar(distance);
      transitioning.current = true;
    }
    previousBodyPosition.current = null;
    controlsRef.current.update();
  }, [cameraMode, selectedBodyId, scaleMode, region, size.width, size.height, bodyRadius, systemRadius, camera, selectedBody]);

  useSceneFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls || !(camera instanceof THREE.PerspectiveCamera)) return;
    if (selectedBody && (cameraMode === 'focus' || cameraMode === 'follow')) {
      const position = getBodyPosition(selectedBody.id, scaleMode)?.displayPosition;
      if (!position) return;
      targetPosition.set(position.x, position.y, position.z);
      // Move the camera with the body after framing so date jumps cannot leave it behind.
      if (previousBodyPosition.current && !transitioning.current) {
        camera.position.add(targetCamera.copy(targetPosition).sub(previousBodyPosition.current));
      }
      controls.target.copy(targetPosition);
      targetCamera.copy(targetPosition).add(followOffset.current);
      if (cameraMode === 'follow' || transitioning.current) {
        camera.position.lerp(targetCamera, reducedMotion ? 1 : Math.min(1, delta * 5));
        if (camera.position.distanceTo(targetCamera) < Math.max(bodyRadius * 0.01, 1e-8)) transitioning.current = false;
      }
      if (!previousBodyPosition.current) previousBodyPosition.current = new THREE.Vector3();
      previousBodyPosition.current.copy(targetPosition);
    }

    const distance = camera.position.distanceTo(controls.target);
    const inspecting = selectedBody && (cameraMode === 'focus' || cameraMode === 'follow');
    const radius = inspecting ? bodyRadius : systemRadius;
    const near = Math.max(1e-7, inspecting ? (distance - radius) * 0.1 : distance * 0.001);
    const far = Math.max(distance + radius * 4, camera.position.length() + fullRadius * 1.2);
    if (Math.abs(camera.near - near) > near * 0.02 || Math.abs(camera.far - far) > far * 0.02) {
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();
    }
    controls.minDistance = Math.max(bodyRadius * 1.05, 1e-7);
    controls.maxDistance = fullRadius * 8;
    controls.update();
  });

  return <OrbitControls ref={controlsRef} enableDamping={!reducedMotion} dampingFactor={0.06}
    minDistance={1e-7} maxDistance={fullRadius * 8} zoomSpeed={1.2} rotateSpeed={0.8} />;
};
