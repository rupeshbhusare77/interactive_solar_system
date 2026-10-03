import { guardSceneRenderer } from './useSceneFrame';
/**
 * Scene-local status and recovery keep rendering changes separate from the application UI.
 */
import React, { Suspense, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Starfield } from './Starfield';
import { SunBody } from './SunBody';
import { PlanetBody } from './PlanetBody';
import { CometBody } from './CometBody';
import { AsteroidBelt } from './AsteroidBelt';
import { KuiperBelt } from './KuiperBelt';
import { OrbitPath } from './OrbitPath';
import { HabitableZone } from './HabitableZone';
import { MeasurementLine } from './MeasurementLine';
import { CameraManager } from './CameraManager';
import { PLANETS, DWARF_PLANETS, COMETS } from '../../astronomy/celestialData';
import { ViewRegion } from '../../astronomy/viewBounds';
import { useSimulation } from '../../state/simulationContext';
import { getTextureStatus, subscribeTextureStatus, retainTextureCache } from '../../textures/textureLoader';

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}

function SceneFailure({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div style={{ position: 'absolute', top: 'calc(var(--header-height) + .75rem)',
      bottom: 'calc(var(--timeline-height) + .75rem)', insetInline: '.75rem',
      zIndex: 25, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
      <section role="alert" aria-label="Scene recovery" className="glass-panel rounded-xl p-4"
        style={{ maxWidth: '28rem', width: '100%', maxHeight: '100%', overflow: 'auto', pointerEvents: 'auto' }}>
        <h2 className="text-lg font-semibold">The 3D scene is unavailable</h2>
        <p className="text-sm text-zinc-300 mt-2">{message}</p>
        <p className="text-xs text-zinc-400 mt-2">Your timeline, selection, and settings are preserved. If retrying does not help, enable browser hardware acceleration or try a WebGL 2 compatible browser.</p>
        <button className="glass-button rounded px-3 py-2 mt-3 text-sm" onClick={retry}>Retry scene</button>
      </section>
    </div>
  );
}

class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode; retry: () => void }, { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('Solar system scene failed:', error); }
  render() {
    return this.state.failed
      ? <SceneFailure message="A rendering error interrupted the scene. Retry to rebuild it." retry={this.props.retry} />
      : this.props.children;
  }
}


export const SolarSystemScene: React.FC = () => {
  const { selectBody, viewToggles, isMeasurementOpen, cameraMode } = useSimulation();
  const [region, setRegion] = useState<ViewRegion>('outer');
  const [supported, setSupported] = useState(canUseWebGL);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assets = useSyncExternalStore(subscribeTextureStatus, getTextureStatus);
  useEffect(() => retainTextureCache(), []);
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const lost = (event: Event) => {
      event.preventDefault();
      setFailure('The graphics context was lost. Retry to rebuild the scene.');
    };
    const runtimeError = (event: Event) => {
      console.error('Scene frame or renderer failed:', (event as CustomEvent).detail);
      setFailure('An unexpected rendering error interrupted the scene. Retry to rebuild it.');
    };
    canvas?.addEventListener('webglcontextlost', lost);
    canvas?.addEventListener('sceneerror', runtimeError);
    return () => {
      canvas?.removeEventListener('webglcontextlost', lost);
      canvas?.removeEventListener('sceneerror', runtimeError);
    };
  }, [attempt, failure]);

  const retry = () => {
    setSupported(canUseWebGL());
    setFailure(null);
    setReady(false);
    setAttempt(value => value + 1);
  };
  const bodies = [...PLANETS, ...DWARF_PLANETS];
  const comets = COMETS;

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      {!supported || failure ? <SceneFailure
        message={failure ?? 'This browser could not create a WebGL 2 graphics context.'} retry={retry} /> : (
        <SceneErrorBoundary key={attempt} retry={retry}>
          <Canvas ref={canvasRef}
            camera={{ position: [0, 85, 120], fov: 45, near: 0.01, far: 150000 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1; guardSceneRenderer(gl); setReady(true); }}
            onPointerMissed={() => selectBody(null)}
            >
            <Suspense fallback={null}>
              <color attach="background" args={['#020408']} />
              <Starfield />
              <ambientLight intensity={viewToggles.showLighting ? 0.035 : 1.5} color="#ffffff" />
              <SunBody />
              <HabitableZone />
              {[...bodies, ...COMETS].map(body => <OrbitPath key={body.id} body={body} />)}
              {bodies.map(body => <PlanetBody key={body.id} body={body} />)}
              {comets.map(comet => <CometBody key={comet.id} comet={comet} />)}
              <AsteroidBelt />
              <KuiperBelt />
              {isMeasurementOpen && <MeasurementLine />}
              {viewToggles.showDistanceGrid && <polarGridHelper
                args={[350, 16, 8, 64, '#38bdf8', '#1e293b']} position={[0, -0.05, 0]} />}
              <CameraManager region={region} />
            </Suspense>
          </Canvas>
        </SceneErrorBoundary>
      )}
      <div style={{ position: 'absolute', top: 'calc(var(--header-height) + .5rem)', left: '50%', transform: 'translateX(-50%)',
        zIndex: 15, maxWidth: 'min(25rem, calc(100% - 1.5rem))' }}>
        {(cameraMode === 'top' || cameraMode === 'ecliptic') && (
          <label className="glass-panel rounded p-2 text-xs inline-flex items-center gap-2" style={{ maxWidth: '100%' }}>
            View region
            <select aria-label="View region" value={region} onChange={event => setRegion(event.target.value as ViewRegion)}
              className="bg-black border border-zinc-700 rounded p-1" style={{ minWidth: 0, maxWidth: '100%' }}>
              <option value="inner">Inner system</option>
              <option value="outer">Outer planets and dwarfs</option>
              <option value="full">Full system, including comet orbits</option>
            </select>
          </label>
        )}
        {supported && !failure && (!ready || assets.loading > 0) && (
          <p role="status" className="glass-panel rounded p-2 mt-1 text-xs">Loading scene assets{assets.loading ? `: ${assets.loading} remaining` : '…'}</p>
        )}
        {assets.fallbacks.length > 0 && (
          <details className="glass-panel rounded p-2 mt-1 text-xs">
            <summary>Using fallback maps for {assets.fallbacks.length} assets</summary>
            <p className="text-zinc-300 mt-1">The scene remains usable. Unavailable surface/ring maps use procedural replacements; missing normal and reflectivity maps use neutral data.</p>
            <ul className="mt-1 max-h-24 overflow-auto">{assets.fallbacks.map(name => <li key={name}>{name}</li>)}</ul>
            <button className="glass-button rounded p-1 mt-2" onClick={() => window.location.reload()}>Reload assets</button>
          </details>
        )}
      </div>
    </div>
  );
};
