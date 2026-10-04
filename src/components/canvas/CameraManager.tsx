import { useSceneFrame } from './useSceneFrame';
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import { useSimulation } from '../../state/simulationContext';
import { CELESTIAL_BODY_MAP } from '../../astronomy/celestialData';
import { scaleRadius } from '../../astronomy/scaling';
import { satelliteSystemRadius, bodyViewRadius, systemViewRadius, fitViewDistance, ViewRegion } from '../../astronomy/viewBounds';
import { cameraProgress } from './cameraMotion';

/** Opt-in frame diagnostics let regression tests observe camera poses without GPU timing assumptions. */
function publishCamera(canvas: HTMLCanvasElement, camera: THREE.PerspectiveCamera, controls: OrbitControlsImpl, id: number, progress: number, moving: boolean) {
  canvas.dataset.cameraState = moving ? 'moving' : 'idle';
  canvas.dataset.cameraDistance = String(camera.position.distanceTo(controls.target));
  canvas.dispatchEvent(new CustomEvent('camera-motion', { bubbles: true, detail: {
    id, progress, position: camera.position.toArray(), target: controls.target.toArray(),
    projection: [camera.view?.offsetX ?? 0, camera.view?.offsetY ?? 0],
  } }));
}

/** Frame targets in the unobstructed viewport and preserve manual zoom after arrival. */
export const CameraManager: React.FC<{ region?: ViewRegion }> = ({ region = 'outer' }) => {
  const { cameraMode, cameraResetVersion, selectedBodyId, selectionVersion, getBodyPosition, scaleMode, isInfoOpen, smoothCameraMotion } = useSimulation();
  const { camera, size, invalidate, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const reducedMotion = !smoothCameraMotion;
  const diagnostics = useMemo(() => new URLSearchParams(location.search).has('cameraDiagnostics'), []);
  const [viewport, setViewport] = useState({ left: 0, top: 0, width: size.width, height: size.height });
  const flight = useRef({ id: 0, active: false, elapsed: 0, reset: false, startTarget: new THREE.Vector3(), startOffset: new THREE.Vector3(), startView: new THREE.Vector2() });
  const previousResetVersion = useRef(cameraResetVersion);
  const previousBodyPosition = useRef<THREE.Vector3 | null>(null);
  const vectors = useMemo(() => ({ target: new THREE.Vector3(), offset: new THREE.Vector3(), direction: new THREE.Vector3(), delta: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) }), []);
  const selectedBody = selectedBodyId ? CELESTIAL_BODY_MAP.get(selectedBodyId) : null;
  const inspecting = !!selectedBody && ['system', 'focus', 'follow'].includes(cameraMode);
  const bodyRadius = selectedBody ? cameraMode === 'system' ? satelliteSystemRadius(selectedBody, scaleMode) : bodyViewRadius(selectedBody, scaleMode) : 1;
  const systemRadius = useMemo(() => systemViewRadius(scaleMode, region), [scaleMode, region]);
  const fullRadius = useMemo(() => systemViewRadius(scaleMode, 'full'), [scaleMode]);

  useEffect(() => {
    const measure = () => {
      const rect = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
      const header = rect('.app-header'), timeline = rect('.timeline-panel'), dock = rect('.quick-dock'), info = rect('.info-panel');
      let left = 0, right = size.width, top = header?.bottom ?? 0, bottom = timeline?.top ?? size.height;
      if (size.width < 768) {
        bottom = Math.min(bottom, dock?.top ?? bottom);
        if (info && info.width < size.width * .75 && info.left > 0) right = Math.min(right, info.left);
        else bottom = Math.min(bottom, info?.top ?? bottom);
      }
      else { left = dock?.right ?? 0; if (info) right = info.left; }
      const next = { left: left + 12, top: top + 12, width: Math.max(24, right - left - 24), height: Math.max(24, bottom - top - 24) };
      setViewport(previous => Object.keys(next).every(key => Math.abs(previous[key as keyof typeof next] - next[key as keyof typeof next]) < 1) ? previous : next);
    };
    const observer = new ResizeObserver(measure);
    for (const selector of ['.app-header', '.timeline-panel', '.quick-dock', '.info-panel']) {
      const element = document.querySelector(selector);
      if (element) observer.observe(element);
    }
    measure();
    return () => observer.disconnect();
  }, [size.width, size.height, isInfoOpen, selectedBodyId]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !(camera instanceof THREE.PerspectiveCamera)) return;
    const resetRequested = previousResetVersion.current !== cameraResetVersion;
    previousResetVersion.current = cameraResetVersion;
    if (cameraMode === 'free' && !resetRequested) {
      // Deselection stops tracking without changing the current pose or projection.
      if (!flight.current.reset) flight.current.active = false;
      previousBodyPosition.current = null;
      if (diagnostics && !flight.current.active) publishCamera(gl.domElement, camera, controls, flight.current.id, 1, false);
      invalidate();
      return;
    }
    flight.current.reset = resetRequested;
    flight.current.startTarget.copy(controls.target);
    flight.current.startOffset.copy(camera.position).sub(controls.target);
    flight.current.startView.set(camera.view?.offsetX ?? 0, camera.view?.offsetY ?? 0);
    flight.current.elapsed = 0;
    flight.current.active = true;
    flight.current.id += 1;
    controls.enableDamping = false;
    controls.minDistance = 1e-7;
    previousBodyPosition.current = null;
    if (diagnostics) publishCamera(gl.domElement, camera, controls, flight.current.id, 0, true);
    invalidate();
  }, [cameraMode, cameraResetVersion, selectedBodyId, selectionVersion, scaleMode, region, viewport, camera, size.width, size.height, invalidate, smoothCameraMotion, diagnostics, gl]);

  useSceneFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls || !(camera instanceof THREE.PerspectiveCamera)) return;
    const { target, offset, direction, delta: movement, up } = vectors;
    const position = inspecting ? getBodyPosition(selectedBody!.id, scaleMode)?.displayPosition : null;
    if (inspecting && !position) { invalidate(); return; }
    target.set(position?.x ?? 0, position?.y ?? 0, position?.z ?? 0);
    const radius = inspecting ? bodyRadius : systemRadius;
    const usableFov = 2 * Math.atan(Math.tan(camera.fov * Math.PI / 360) * viewport.height / size.height) * 180 / Math.PI;
    const distance = fitViewDistance(radius, usableFov, viewport.width / viewport.height);
    if (flight.current.reset) offset.set(0, 85, 120);
    else if (cameraMode === 'top') offset.set(0, distance, distance * .001);
    else if (cameraMode === 'ecliptic') offset.set(0, distance * .015, distance);
    else if (inspecting) {
      direction.copy(target).negate();
      if (direction.lengthSq() < 1e-12) direction.set(0, 0, 1);
      direction.normalize();
      movement.crossVectors(direction, up);
      if (movement.lengthSq() < 1e-6) movement.set(1, 0, 0);
      offset.copy(direction).addScaledVector(movement.normalize(), .65);
      offset.y += .25;
      offset.normalize().multiplyScalar(distance);
    } else offset.set(0, distance * .58, distance * .82);

    let progress = 1;
    if (flight.current.active) {
      const current = flight.current;
      current.elapsed += Math.min(delta, .1);
      progress = reducedMotion ? 1 : Math.min(1, current.elapsed / 1.6);
      const eased = reducedMotion ? 1 : cameraProgress(current.elapsed);
      const viewX = cameraMode === 'free' ? 0 : size.width / 2 - (viewport.left + viewport.width / 2);
      const viewY = cameraMode === 'free' ? 0 : size.height / 2 - (viewport.top + viewport.height / 2);
      camera.setViewOffset(size.width, size.height,
        THREE.MathUtils.lerp(current.startView.x, viewX, eased),
        THREE.MathUtils.lerp(current.startView.y, viewY, eased), size.width, size.height);
      // Only an explicit reset moves Free Orbit back to the startup overview.
      if (cameraMode !== 'free' || current.reset) {
        controls.target.copy(current.startTarget).lerp(target, eased);
        const startDistance = Math.max(current.startOffset.length(), 1e-7);
        const endDistance = Math.max(offset.length(), 1e-7);
        direction.copy(current.startOffset).normalize();
        movement.copy(offset).normalize();
        const rotation = new THREE.Quaternion().setFromUnitVectors(direction, movement);
        rotation.slerp(new THREE.Quaternion(), 1 - eased);
        direction.applyQuaternion(rotation);
        direction.normalize().multiplyScalar(Math.exp(THREE.MathUtils.lerp(Math.log(startDistance), Math.log(endDistance), eased)));
        camera.position.copy(controls.target).add(direction);
      }
      current.active = progress < 1;
      if (!current.active) current.reset = false;
      if (current.active) invalidate();
    } else if (inspecting && previousBodyPosition.current) {
      // Track translation without overriding the user's orbit, pan, or zoom.
      movement.copy(target).sub(previousBodyPosition.current);
      camera.position.add(movement);
      controls.target.add(movement);
    }
    if (inspecting) {
      if (!previousBodyPosition.current) previousBodyPosition.current = new THREE.Vector3();
      previousBodyPosition.current.copy(target);
    }
    const actualDistance = camera.position.distanceTo(controls.target);
    const surfaceRadius = selectedBody ? scaleRadius(selectedBody.physical.radiusKm, selectedBody.type, scaleMode, selectedBody.id) : 0;
    const near = Math.max(1e-7, inspecting ? (actualDistance - surfaceRadius) * .02 : actualDistance * .001);
    const far = Math.max(actualDistance + radius * 4, camera.position.length() + fullRadius * 1.2);
    if (Math.abs(camera.near - near) > near * .02 || Math.abs(camera.far - far) > far * .02) {
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();
    }
    controls.minDistance = flight.current.active ? 1e-7 : Math.max(inspecting ? surfaceRadius * 1.05 : 1e-4, 1e-7);
    controls.maxDistance = fullRadius * 8;
    controls.enableDamping = !reducedMotion && !flight.current.active;
    controls.update();
    if (diagnostics) publishCamera(gl.domElement, camera, controls, flight.current.id, progress, flight.current.active);
  });

  return <OrbitControls ref={controlsRef} enableDamping={!reducedMotion} dampingFactor={.08}
    onStart={() => { flight.current.active = false; }}
    minDistance={1e-7} maxDistance={fullRadius * 8} zoomSpeed={.9} rotateSpeed={.7} />;
};
