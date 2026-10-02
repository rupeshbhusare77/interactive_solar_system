/**
 * 3D Solar System Simulator — Planet Quick-Select Dock
 * Quick access bar allowing 1-click camera flight to any major planet or the Sun.
 */

import React from 'react';
import { useSimulation } from '../../state/simulationContext';
import { SUN, PLANETS, CELESTIAL_BODY_MAP } from '../../astronomy/celestialData';

const QUICK_BODIES = [
  SUN,
  CELESTIAL_BODY_MAP.get('mercury')!,
  CELESTIAL_BODY_MAP.get('venus')!,
  CELESTIAL_BODY_MAP.get('earth')!,
  CELESTIAL_BODY_MAP.get('mars')!,
  CELESTIAL_BODY_MAP.get('ceres')!,
  CELESTIAL_BODY_MAP.get('jupiter')!,
  CELESTIAL_BODY_MAP.get('saturn')!,
  CELESTIAL_BODY_MAP.get('uranus')!,
  CELESTIAL_BODY_MAP.get('neptune')!,
  CELESTIAL_BODY_MAP.get('pluto')!,
];

export const PlanetQuickDock: React.FC = () => {
  const { selectedBodyId, selectBody, setCameraMode } = useSimulation();

  return (
    <aside aria-label="Quick body navigation" className="quick-dock glass-panel rounded-2xl p-1.5 border border-white/10 shadow-2xl pointer-events-auto backdrop-blur-xl">
      <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider text-center py-1 border-b border-zinc-800 hidden sm:block">
        Fleet
      </div>

      {QUICK_BODIES.map((body) => {
        const isSelected = selectedBodyId === body.id;

        return (
          <button
            key={`dock-${body.id}`}
            onClick={() => {
              selectBody(body.id);
              setCameraMode('focus');
            }}
            className={`group relative p-2 rounded-xl flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-sky-500/25 border border-sky-400/80 shadow-glow-cyan'
                : 'hover:bg-white/10 border border-transparent'
            }`}
            title={`Focus ${body.name}`}
            aria-label={`Focus ${body.name}`}
            aria-pressed={isSelected}
          >
            {/* Color dot icon */}
            <div
              className={`w-3.5 h-3.5 rounded-full transition-transform group-hover:scale-125 ${
                isSelected ? 'scale-125 ring-2 ring-sky-400' : ''
              }`}
              style={{ backgroundColor: body.physical.color }}
            />

            <span className="ml-2 text-[11px]">{body.name}</span>
          </button>
        );
      })}
    </aside>
  );
};
