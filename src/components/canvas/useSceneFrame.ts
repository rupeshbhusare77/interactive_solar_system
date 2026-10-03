import { useFrame, RenderCallback } from '@react-three/fiber';
import * as THREE from 'three';

function reportSceneError(canvas: HTMLCanvasElement, error: unknown) {
  canvas.dispatchEvent(new CustomEvent('sceneerror', { detail: error }));
}

/** Frame errors belong to this canvas, not to unrelated application promises or controls. */
export function useSceneFrame(callback: RenderCallback, priority?: number) {
  useFrame((state, delta, frame) => {
    try { callback(state, delta, frame); }
    catch (error) { reportSceneError(state.gl.domElement, error); }
  }, priority);
}

export function guardSceneRenderer(renderer: THREE.WebGLRenderer) {
  const render = renderer.render.bind(renderer);
  renderer.render = (scene, camera) => {
    try { render(scene, camera); }
    catch (error) { reportSceneError(renderer.domElement, error); }
  };
}
