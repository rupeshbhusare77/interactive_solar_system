/**
 * 3D Solar System Simulator — Real-Time Orbital Radar MiniMap
 * Top-down 2D radar scope showing current heliocentric positions of all major planets,
 * vernal equinox orientation, distance range rings, and real-time measurement vectors.
 */

import React, { useState } from 'react';
import { useSimulation } from '../../state/simulationContext';
import { PLANETS, DWARF_PLANETS } from '../../astronomy/celestialData';
import { Compass, X, Minus, ChevronUp } from 'lucide-react';

export const MiniMap: React.FC = () => {
  const {
    simulationDate,
    selectedBodyId,
    selectBody,
    setCameraMode,
    getBodyEphemeris,
    isMeasurementOpen,
    measurementOriginId,
    measurementTargetId,
  } = useSimulation();

  const [zoomMode, setZoomMode] = useState<'inner' | 'outer'>('inner');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Radar dimensions
  const size = 160;
  const center = size / 2;

  // Scale: max AU shown on radar
  const maxAU = zoomMode === 'inner' ? 2.2 : 32.0;
  const radiusScale = (size * 0.44) / maxAU;

  const visibleBodies =
    zoomMode === 'inner'
      ? PLANETS.filter((p) => (p.orbitalElements?.a ?? 0) <= 2.2)
      : [...PLANETS, ...DWARF_PLANETS];

  // Measurement vector blips
  let measureA: { x: number; y: number } | null = null;
  let measureB: { x: number; y: number } | null = null;
  if (isMeasurementOpen && measurementOriginId && measurementTargetId) {
    const ephemA = getBodyEphemeris(measurementOriginId, simulationDate);
    const ephemB = getBodyEphemeris(measurementTargetId, simulationDate);
    if (ephemA && ephemB) {
      measureA = {
        x: center + ephemA.positionAU.x * radiusScale,
        y: center + ephemA.positionAU.z * radiusScale,
      };
      measureB = {
        x: center + ephemB.positionAU.x * radiusScale,
        y: center + ephemB.positionAU.z * radiusScale,
      };
    }
  }

  return (
    <>
      {/* Mobile Floating Radar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsMobileOpen((prev) => !prev)}
        aria-label="Toggle Orbital Radar"
        className="mobile-radar-trigger md:hidden fixed left-3 z-30 p-2 rounded-xl glass-panel border border-ui-line shadow-glow-cyan text-ui-accent"
      >
        <Compass className="w-4 h-4" />
      </button>

      {/* Radar Panel */}
      {isMinimized ? (
        <div
          className={`radar-panel pointer-events-auto ${
            isMobileOpen ? 'mobile-radar-active' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="glass-panel rounded-xl py-1.5 px-3 border border-ui-line shadow-2xl flex items-center gap-2 pointer-events-auto backdrop-blur-xl text-ui-accent hover:text-ui-primary"
            title="Expand Orbital Radar"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono font-semibold">Radar Scope</span>
            <ChevronUp className="w-3 h-3 text-ui-muted" />
          </button>
        </div>
      ) : (
        <div
          className={`radar-panel glass-panel rounded-xl p-2 border border-ui-line shadow-2xl flex-col gap-1.5 pointer-events-auto backdrop-blur-xl ${
            isMobileOpen ? 'mobile-radar-active' : ''
          }`}
        >
          {/* Radar Header */}
          <div className="flex items-center justify-between gap-2 text-[10px] text-ui-muted font-mono border-b border-ui-line pb-1 mb-0.5">
            <span className="flex items-center gap-1 text-ui-accent font-semibold whitespace-nowrap">
              <Compass className="w-3 h-3" /> Radar Scope
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setZoomMode((prev) => (prev === 'inner' ? 'outer' : 'inner'))}
                className="text-ui-secondary hover:text-ui-primary px-1.5 py-0.5 rounded bg-ui-inset text-[9px] uppercase font-bold border border-ui-line transition-colors whitespace-nowrap"
              >
                {zoomMode === 'inner' ? 'Inner 2 AU' : 'Outer 32 AU'}
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="hidden sm:inline-flex p-0.5 rounded hover:bg-ui-inset text-ui-muted hover:text-ui-primary transition-colors"
                title="Minimize radar"
                aria-label="Minimize radar"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              {isMobileOpen && (
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="radar-close md:hidden p-0.5 rounded hover:bg-ui-inset text-ui-muted hover:text-ui-primary transition-colors"
                  aria-label="Close radar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>


        {/* SVG Radar Screen */}
        <div className="relative w-full aspect-square bg-black/90 rounded-lg overflow-hidden border border-ui-line">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
            {/* Concentric distance range rings */}
            <circle
              cx={center}
              cy={center}
              r={size * 0.15}
              fill="none"
              stroke="#1e293b"
              strokeDasharray="2 2"
            />
            <circle
              cx={center}
              cy={center}
              r={size * 0.3}
              fill="none"
              stroke="#1e293b"
              strokeDasharray="2 2"
            />
            <circle cx={center} cy={center} r={size * 0.44} fill="none" stroke="#334155" />

            {/* AU Distance Labels */}
            <text
              x={center + 3}
              y={center - size * 0.15 + 8}
              fill="#475569"
              fontSize="7"
              fontFamily="monospace"
            >
              {zoomMode === 'inner' ? '0.7 AU' : '10 AU'}
            </text>
            <text
              x={center + 3}
              y={center - size * 0.3 + 8}
              fill="#475569"
              fontSize="7"
              fontFamily="monospace"
            >
              {zoomMode === 'inner' ? '1.5 AU' : '20 AU'}
            </text>
            <text
              x={center + 3}
              y={center - size * 0.44 + 8}
              fill="#64748b"
              fontSize="7"
              fontFamily="monospace"
            >
              {zoomMode === 'inner' ? '2.2 AU' : '32 AU'}
            </text>

            {/* Vernal Equinox (Aries) direction indicator */}
            <text
              x={size - 12}
              y={center - 3}
              fill="#38bdf8"
              fontSize="9"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              ♈
            </text>

            {/* Active Measurement Vector Line */}
            {measureA && measureB && (
              <line
                x1={measureA.x}
                y1={measureA.y}
                x2={measureB.x}
                y2={measureB.y}
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="3 2"
              />
            )}

            {/* Central Sun */}
            <circle cx={center} cy={center} r={3.5} fill="#fbbf24" />

            {/* Orbits and Planet Blips */}
            {visibleBodies.map((body) => {
              if (!body.orbitalElements) return null;

              const ephemeris = getBodyEphemeris(body.id, simulationDate);
              if (!ephemeris) return null;
              const orbitR = body.orbitalElements.a * radiusScale;

              // 2D position on radar
              const px = center + ephemeris.positionAU.x * radiusScale;
              const py = center + ephemeris.positionAU.z * radiusScale;

              const isSelected = selectedBodyId === body.id;

              return (
                <g key={`radar-${body.id}`}>
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
                    fill={body.physical.color}
                    className="cursor-pointer transition-all hover:scale-150"
                    onClick={() => {
                      selectBody(body.id);
                      setCameraMode('focus');
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Focus ${body.name} on radar`}
                    aria-pressed={isSelected}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectBody(body.id);
                        setCameraMode('focus');
                      }
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Crosshair lines */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-ui-selected pointer-events-none" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-ui-selected pointer-events-none" />
        </div>
      </div>
      )}
    </>
  );
};
