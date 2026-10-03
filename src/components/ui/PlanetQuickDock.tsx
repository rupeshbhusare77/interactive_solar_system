/**
 * 3D Solar System Simulator — Planet Quick-Select Dock
 * Quick access bar allowing 1-click camera flight to major planets, moons, or comets.
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSimulation } from '../../state/simulationContext';
import { SUN, CELESTIAL_BODY_MAP } from '../../astronomy/celestialData';

const PLANET_BODIES = [
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
].filter(Boolean);

const MOON_BODIES = [
  CELESTIAL_BODY_MAP.get('moon')!,
  CELESTIAL_BODY_MAP.get('io')!,
  CELESTIAL_BODY_MAP.get('europa')!,
  CELESTIAL_BODY_MAP.get('ganymede')!,
  CELESTIAL_BODY_MAP.get('callisto')!,
  CELESTIAL_BODY_MAP.get('titan')!,
  CELESTIAL_BODY_MAP.get('enceladus')!,
  CELESTIAL_BODY_MAP.get('triton')!,
].filter(Boolean);

const COMET_BODIES = [
  CELESTIAL_BODY_MAP.get('halley')!,
  CELESTIAL_BODY_MAP.get('encke')!,
  CELESTIAL_BODY_MAP.get('hale-bopp')!,
].filter(Boolean);

type DockCategory = 'planets' | 'moons' | 'comets';

export const PlanetQuickDock: React.FC = () => {
  const { selectedBodyId, selectBody, setCameraMode } = useSimulation();
  const [category, setCategory] = useState<DockCategory>('planets');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--preferred-dock-width',
      isCollapsed ? '3.25rem' : '10rem'
    );
  }, [isCollapsed]);

  const bodies =
    category === 'planets'
      ? PLANET_BODIES
      : category === 'moons'
      ? MOON_BODIES
      : COMET_BODIES;

  return (
    <aside
      aria-label="Quick body navigation"
      className={`quick-dock glass-panel rounded-2xl p-1.5 border border-white/10 shadow-2xl pointer-events-auto backdrop-blur-xl transition-all duration-200 ${
        isCollapsed ? 'dock-collapsed' : 'dock-expanded'
      }`}
    >
      {/* Category selector & Collapse toggle (desktop) */}
      <div className="dock-header pb-1 mb-1 border-b border-zinc-800/80 hidden sm:flex items-center justify-between gap-1 px-1">
        {!isCollapsed && (
          <div className="dock-category-tabs flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setCategory('planets')}
              className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded transition-colors ${
                category === 'planets'
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-400/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Fleet
            </button>
            <button
              type="button"
              onClick={() => setCategory('moons')}
              className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded transition-colors ${
                category === 'moons'
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-400/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Moons
            </button>
            <button
              type="button"
              onClick={() => setCategory('comets')}
              className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded transition-colors ${
                category === 'comets'
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-400/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Comets
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Fleet Dock' : 'Collapse Fleet Dock'}
          aria-label={isCollapsed ? 'Expand Fleet Dock' : 'Collapse Fleet Dock'}
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors ml-auto shrink-0"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Body List */}
      <div className="dock-body-list flex flex-col gap-0.5 sm:gap-1 overflow-y-auto overflow-x-hidden flex-1">
        {bodies.map((body) => {
          const isSelected = selectedBodyId === body.id;

          return (
            <button
              key={`dock-${body.id}`}
              onClick={() => {
                selectBody(body.id);
                setCameraMode('focus');
              }}
              className={`group relative rounded-xl flex items-center transition-all whitespace-nowrap ${
                isCollapsed
                  ? 'justify-center p-2'
                  : 'justify-start p-1.5 sm:p-2'
              } ${
                isSelected
                  ? 'bg-sky-500/25 border border-sky-400/80 shadow-glow-cyan'
                  : 'hover:bg-white/10 border border-transparent'
              }`}
              title={`${body.name} (${body.type})`}
              aria-label={`Focus ${body.name}`}
              aria-pressed={isSelected}
            >
              {/* Color dot icon */}
              <div
                className={`w-3.5 h-3.5 rounded-full shrink-0 transition-transform group-hover:scale-125 ${
                  isSelected ? 'scale-125 ring-2 ring-sky-400' : ''
                }`}
                style={{ backgroundColor: body.physical.color }}
              />

              {!isCollapsed && (
                <span className="ml-2 text-[11px] font-medium text-zinc-200 group-hover:text-white">
                  {body.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
