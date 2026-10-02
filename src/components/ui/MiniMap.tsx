/**
 * 3D Solar System Simulator — Real-Time Orbital Radar MiniMap
 * Top-down 2D radar scope showing current heliocentric positions of all major planets.
 */

import React, { useState } from 'react';
import { useSimulation } from '../../state/simulationContext';
import { PLANETS } from '../../astronomy/celestialData';
import { calculateEphemeris } from '../../astronomy/kepler';
import { Compass, ZoomIn, ZoomOut } from 'lucide-react';

export const MiniMap: React.FC = () => {
  const { simulationDate, selectedBodyId, selectBody, setCameraMode } = useSimulation();
  const [zoomMode, setZoomMode] = useState<'inner' | 'outer'>('inner');

  // Radar dimensions
  const size = 160;
  const center = size / 2;

  // Scale: max AU shown on radar
  const maxAU = zoomMode === 'inner' ? 2.2 : 32.0;
  const radiusScale = (size * 0.44) / maxAU;

  const visiblePlanets = zoomMode === 'inner'
    ? PLANETS.filter((p) => (p.orbitalElements?.a ?? 0) <= 2.2)
    : PLANETS;

  return (
    <div className="absolute bottom-4 left-4 z-20 glass-panel rounded-xl p-2 border border-white/10 shadow-2xl flex flex-col gap-1.5 pointer-events-auto backdrop-blur-xl hidden md:flex">
      {/* Radar Header */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono border-b border-zinc-800 pb-1">
        <span className="flex items-center gap-1 text-sky-400">
          <Compass className="w-3 h-3" /> Orbital Radar
        </span>
        <button
          onClick={() => setZoomMode((prev) => (prev === 'inner' ? 'outer' : 'inner'))}
          className="text-zinc-300 hover:text-white px-1 py-0.5 rounded bg-zinc-800/80 text-[9px] uppercase font-bold"
        >
          {zoomMode === 'inner' ? 'Inner (2 AU)' : 'Outer (30 AU)'}
        </button>
      </div>

      {/* SVG Radar Screen */}
      <div className="relative w-40 h-40 bg-black/80 rounded-lg overflow-hidden border border-zinc-800">
        <svg width={size} height={size} className="w-full h-full">
          {/* Concentric distance range rings */}
          <circle cx={center} cy={center} r={size * 0.15} fill="none" stroke="#1e293b" strokeDasharray="2 2" />
          <circle cx={center} cy={center} r={size * 0.3} fill="none" stroke="#1e293b" strokeDasharray="2 2" />
          <circle cx={center} cy={center} r={size * 0.44} fill="none" stroke="#334155" />

          {/* Central Sun */}
          <circle cx={center} cy={center} r={3.5} fill="#fbbf24" />

          {/* Orbits and Planet Blips */}
          {visiblePlanets.map((planet) => {
            if (!planet.orbitalElements) return null;

            const ephemeris = calculateEphemeris(planet.orbitalElements, simulationDate);
            const orbitR = planet.orbitalElements.a * radiusScale;

            // 2D position on radar
            const px = center + ephemeris.positionAU.x * radiusScale;
            const py = center + ephemeris.positionAU.z * radiusScale;

            const isSelected = selectedBodyId === planet.id;

            return (
              <g key={`radar-${planet.id}`}>
                {/* Orbit Circle */}
                <circle
                  cx={center}
                  cy={center}
                  r={orbitR}
                  fill="none"
                  stroke={isSelected ? '#38bdf8' : '#334155'}
                  strokeWidth={isSelected ? 1.2 : 0.6}
                  strokeOpacity={0.6}
                />

                {/* Planet Blip */}
                <circle
                  cx={px}
                  cy={py}
                  r={isSelected ? 3.5 : 2.2}
                  fill={planet.physical.color}
                  className="cursor-pointer transition-all hover:scale-150"
                  onClick={() => {
                    selectBody(planet.id);
                    setCameraMode('focus');
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Crosshair lines */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-sky-500/10 pointer-events-none" />
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-sky-500/10 pointer-events-none" />
      </div>
    </div>
  );
};
