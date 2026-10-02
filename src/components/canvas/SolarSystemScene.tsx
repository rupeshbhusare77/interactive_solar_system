/**
 * 3D Solar System Simulator — Main 3D Canvas Scene
 * Integrates astronomical bodies, instanced belts, lighting, orbits, and camera systems.
 */

import React, { Suspense } from 'react';
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
import { useSimulation } from '../../state/simulationContext';

export const SolarSystemScene: React.FC = () => {
  const { selectBody, viewToggles } = useSimulation();

  return (
    <div
      className="w-full h-full relative cursor-grab active:cursor-grabbing"
      onClick={() => selectBody(null)}
    >
      <Canvas
        camera={{ position: [0, 85, 120], fov: 45, near: 0.001, far: 100000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          {/* Deep Space Background */}
          <color attach="background" args={['#020408']} />
          <Starfield />

          {/* Space ambient lighting (preserves subtle visibility on dark sides) */}
          <ambientLight intensity={viewToggles.showLighting ? 0.08 : 0.4} color="#e0f2fe" />

          {/* Central Sun */}
          <SunBody />

          {/* Habitable Zone Ring */}
          <HabitableZone />

          {/* Planetary Orbits */}
          {PLANETS.map((planet) => (
            <OrbitPath key={`orbit-${planet.id}`} body={planet} />
          ))}
          {DWARF_PLANETS.map((dwarf) => (
            <OrbitPath key={`orbit-${dwarf.id}`} body={dwarf} />
          ))}
          {COMETS.map((comet) => (
            <OrbitPath key={`orbit-${comet.id}`} body={comet} />
          ))}

          {/* 8 Major Planets */}
          {PLANETS.map((planet) => (
            <PlanetBody key={planet.id} body={planet} />
          ))}

          {/* Dwarf Planets */}
          {DWARF_PLANETS.map((dwarf) => (
            <PlanetBody key={dwarf.id} body={dwarf} />
          ))}

          {/* Selected Comets */}
          {COMETS.map((comet) => (
            <CometBody key={comet.id} comet={comet} />
          ))}

          {/* GPU Instanced Asteroid Belt & Kuiper Belt */}
          <AsteroidBelt />
          <KuiperBelt />

          {/* Real-time Astronomical Distance Measurement Vector */}
          <MeasurementLine />

          {/* Optional Heliocentric Ecliptic Polar Grid */}
          {viewToggles.showDistanceGrid && (
            <polarGridHelper
              args={[350, 16, 8, 64, '#38bdf8', '#1e293b']}
              position={[0, -0.05, 0]}
            />
          )}

          {/* Interactive Dynamic Camera System */}
          <CameraManager />
        </Suspense>
      </Canvas>
    </div>
  );
};
