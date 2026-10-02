/**
 * 3D Solar System Simulator — Real-Time Astronomical Telemetry & Information Panel
 * Displays live dynamically calculated distances, orbital velocity, light travel times,
 * and comprehensive physical and orbital NASA specifications.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  Zap,
  Radio,
  Ruler,
  Maximize2,
  Minimize2,
  ChevronRight,
  Info,
  Flame,
  Wind,
} from 'lucide-react';
import { useSimulation } from '../../state/simulationContext';
import { CELESTIAL_BODY_MAP, MOONS } from '../../astronomy/celestialData';
import { distanceBetween, dateToJulianDate } from '../../astronomy/kepler';
import { KM_PER_AU, LIGHT_SECONDS_PER_AU } from '../../astronomy/constants';

export const InfoPanel: React.FC = () => {
  const {
    selectedBodyId,
    selectBody,
    isInfoOpen,
    setIsInfoOpen,
    simulationDate,
    setCameraMode,
    setMeasurementOriginId,
    setMeasurementTargetId,
    setIsMeasurementOpen,
    getBodyPosition,
    getBodyEphemeris,
  } = useSimulation();

  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => setIsExpanded(false), [selectedBodyId]);

  if (!isInfoOpen || !selectedBodyId) return null;

  const body = CELESTIAL_BODY_MAP.get(selectedBodyId);
  if (!body) return null;

  const orbit = body.orbitalElements ?? body.moonOrbitalElements;
  const julianDate = dateToJulianDate(simulationDate);
  const outsideLocalModel = !!orbit?.modelRangeJD &&
    (julianDate < orbit.modelRangeJD[0] || julianDate > orbit.modelRangeJD[1]);
  const retrogradeSpin = body.moonOrbitalElements
    ? body.moonOrbitalElements.i > 90
    : body.physical.axialTiltDeg > 90;

  // Live dynamic ephemeris calculation
  const ephemeris = body.orbitalElements
    ? getBodyEphemeris(body.id, simulationDate)
    : null;

  // Real-time distance to Earth
  let distToEarthAU = 0;
  let lightTimeToEarth = '';
  if (body.id !== 'earth') {
    const earthPosition = getBodyPosition('earth', 'real', simulationDate);
    const targetPosition = getBodyPosition(body.id, 'real', simulationDate);
    distToEarthAU = earthPosition && targetPosition ? distanceBetween(targetPosition.physicalAU,earthPosition.physicalAU) : NaN;

    const lightSeconds = distToEarthAU * LIGHT_SECONDS_PER_AU;
    if (!Number.isFinite(lightSeconds)) {
      lightTimeToEarth = 'Unavailable';
    } else if (lightSeconds < 60) {
      lightTimeToEarth = `${lightSeconds.toFixed(1)}s`;
    } else if (lightSeconds < 3600) {
      const mins = Math.floor(lightSeconds / 60);
      const secs = Math.floor(lightSeconds % 60);
      lightTimeToEarth = `${mins}m ${secs}s`;
    } else {
      lightTimeToEarth = `${(lightSeconds / 3600).toFixed(2)}h`;
    }
  }

  // Child moons for this planet
  const childMoons = MOONS.filter((m) => m.parentId === body.id);

  // Perihelion and Aphelion if orbital elements present
  const perihelionAU = body.orbitalElements ? body.orbitalElements.a * (1 - body.orbitalElements.e) : null;
  const aphelionAU = body.orbitalElements ? body.orbitalElements.a * (1 + body.orbitalElements.e) : null;

  return (
    <aside aria-label={`${body.name} information`} data-expanded={isExpanded} className="info-panel hud-inspector glass-panel rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden pointer-events-auto backdrop-blur-xl">
      {/* Header Bar */}
      <div
        className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between"
        style={{ borderTop: `3px solid ${body.physical.color}` }}
      >
        <div className="flex items-center space-x-2.5">
          <div
            className="w-3.5 h-3.5 rounded-full shadow-md"
            style={{ backgroundColor: body.physical.color }}
          />
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              {body.name}
            </h2>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded">
              {body.type}
            </span>
          </div>
        </div>

        <button aria-expanded={isExpanded} aria-controls="body-details" onClick={() => setIsExpanded(!isExpanded)} className="panel-expand glass-button rounded px-2 py-1 text-xs">{isExpanded ? 'Collapse' : 'Details'}</button>
        <button
          onClick={() => setIsInfoOpen(false)}
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Close telemetry panel"
          aria-label="Close telemetry panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div id="body-details" className="panel-body min-h-0 flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
        {/* Quick Camera Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setCameraMode('focus')}
            className="px-2.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Focus Camera</span>
          </button>
          <button
            onClick={() => setCameraMode('follow')}
            className="px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Lock & Follow</span>
          </button>
        </div>

        {/* Live Dynamic Astronomical Telemetry */}
        <div className="bg-black/50 border border-zinc-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 font-mono text-[10px] uppercase tracking-wider border-b border-zinc-800 pb-1">
            <span className="flex items-center gap-1 text-sky-400">
              <Radio className="w-3 h-3 animate-pulse" /> Live Telemetry
            </span>
            <span>Real-time</span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono">
            {ephemeris && (
              <div>
                <span className="text-[10px] text-zinc-500 block">Dist to Sun</span>
                <span className="text-white font-semibold text-xs">
                  {ephemeris.distanceAU.toFixed(3)} AU
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  {(ephemeris.distanceAU * KM_PER_AU / 1e6).toFixed(1)}M km
                </span>
              </div>
            )}

            {body.id !== 'earth' && (
              <div>
                <span className="text-[10px] text-zinc-500 block">Dist to Earth</span>
                <span className="text-white font-semibold text-xs">
                  {Number.isFinite(distToEarthAU) ? `${distToEarthAU.toFixed(3)} AU` : 'Unavailable'}
                </span>
                <span className="text-[10px] text-amber-300 block">
                  ⚡ {lightTimeToEarth}
                </span>
              </div>
            )}

            {ephemeris && (
              <>
                <div>
                  <span className="text-[10px] text-zinc-500 block">True Anomaly (ν)</span>
                  <span className="text-white font-medium text-xs">
                    {ephemeris.trueAnomalyDeg.toFixed(1)}°
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Heliocentric Long</span>
                  <span className="text-white font-medium text-xs">
                    {ephemeris.heliocentricLongitudeDeg.toFixed(1)}°
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Physical Characteristics Table */}
        <div className="space-y-1.5">
          <h3 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider">
            Physical Characteristics
          </h3>
          <div className="bg-black/30 border border-zinc-800/80 rounded-lg divide-y divide-zinc-800/60 font-mono text-[11px]">
            <div className="px-2.5 py-1.5 flex justify-between">
              <span className="text-zinc-400">Mean Radius</span>
              <span className="text-white font-medium">
                {body.physical.radiusKm.toLocaleString()} km
              </span>
            </div>
            <div className="px-2.5 py-1.5 flex justify-between">
              <span className="text-zinc-400">Mass</span>
              <span className="text-white font-medium">
                {body.physical.massKg.toExponential(3)} kg
              </span>
            </div>
            <div className="px-2.5 py-1.5 flex justify-between">
              <span className="text-zinc-400">Surface Gravity</span>
              <span className="text-white font-medium">
                {body.physical.gravityMs2} m/s²
              </span>
            </div>
            <div className="px-2.5 py-1.5 flex justify-between">
              <span className="text-zinc-400">Mean Density</span>
              <span className="text-white font-medium">
                {body.physical.densityGcm3} g/cm³
              </span>
            </div>
            <div className="px-2.5 py-1.5 flex justify-between">
              <span className="text-zinc-400">Escape Velocity</span>
              <span className="text-white font-medium">
                {body.physical.escapeVelocityKms} km/s
              </span>
            </div>
            <div className="px-2.5 py-1.5 flex justify-between">
              <span className="text-zinc-400">Rotation Period</span>
              <span className="text-white font-medium">
                {Math.abs(body.physical.rotationPeriodHours)} hrs
                {retrogradeSpin ? ' (Retrograde)' : ''}
              </span>
            </div>
            <div className="px-2.5 py-1.5 flex justify-between">
              <span className="text-zinc-400">Axial Tilt</span>
              <span className="text-white font-medium">
                {body.physical.axialTiltDeg}°
              </span>
            </div>
            <div className="px-2.5 py-1.5 flex justify-between">
              <span className="text-zinc-400">Mean Temperature</span>
              <span className="text-white font-medium">
                {body.physical.meanTempC}°C ({(body.physical.meanTempC + 273.15).toFixed(2)} K)
              </span>
            </div>
          </div>
        </div>

        {/* Orbital Elements Table */}
        {body.orbitalElements && (
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider">
              Fixed Keplerian Orbital Elements
            </h3>
            <div className="bg-black/30 border border-zinc-800/80 rounded-lg divide-y divide-zinc-800/60 font-mono text-[11px]">
              <div className="px-2.5 py-1.5 flex justify-between">
                <span className="text-zinc-400">Semi-major Axis (a)</span>
                <span className="text-white font-medium">
                  {body.orbitalElements.a} AU
                </span>
              </div>
              <div className="px-2.5 py-1.5 flex justify-between">
                <span className="text-zinc-400">Eccentricity (e)</span>
                <span className="text-white font-medium">
                  {body.orbitalElements.e}
                </span>
              </div>
              <div className="px-2.5 py-1.5 flex justify-between">
                <span className="text-zinc-400">Inclination (i)</span>
                <span className="text-white font-medium">
                  {body.orbitalElements.i}°
                </span>
              </div>
              <div className="px-2.5 py-1.5 flex justify-between">
                <span className="text-zinc-400">Orbital Period</span>
                <span className="text-white font-medium">
                  {body.orbitalElements.periodDays.toFixed(1)} days (
                  {(body.orbitalElements.periodDays / 365.256).toFixed(2)} yrs)
                </span>
              </div>
              {perihelionAU && (
                <div className="px-2.5 py-1.5 flex justify-between">
                  <span className="text-zinc-400">Perihelion</span>
                  <span className="text-white font-medium">
                    {perihelionAU.toFixed(3)} AU
                  </span>
                </div>
              )}
              {aphelionAU && (
                <div className="px-2.5 py-1.5 flex justify-between">
                  <span className="text-zinc-400">Aphelion</span>
                  <span className="text-white font-medium">
                    {aphelionAU.toFixed(3)} AU
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5 text-[11px] text-zinc-300">
          <h3 className="font-semibold text-amber-300">Model and accuracy</h3>
          <p>Educational approximation. UTC timestamps approximate dynamical time; perturbations and precise surface orientation are omitted.</p>
          {orbit ? (
            <>
              <p>Epoch: JD {orbit.epochJD ?? 'unavailable'} · Plane: {orbit.referencePlane === 'parent-equator' ? 'parent equator (static illustrative pole)' : 'J2000 ecliptic'}</p>
              <p>Provenance: {orbit.provenance?.status ?? 'unverified'}. {orbit.provenance?.note}</p>
              {orbit.modelRangeJD && (
                <p>Local model interval: JD {orbit.modelRangeJD[0]}–{orbit.modelRangeJD[1]}. {outsideLocalModel ? 'This date is outside that interval; propagation is illustrative.' : 'This interval is not an accuracy guarantee.'}</p>
              )}
              {orbit.provenance?.sourceUrls.map((url, index) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="block underline text-sky-300">Orbital source {index + 1}</a>
              ))}
              {!orbit.provenance?.sourceUrls.length && <p>No verified record-level orbital source is available.</p>}
            </>
          ) : <p>The Sun is the heliocentric origin. Its surface rotation and texture orientation are illustrative.</p>}
        </section>

        {/* Atmosphere Composition */}
        {body.physical.atmosphere && body.physical.atmosphere.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-sky-400" /> Atmospheric Composition
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {body.physical.atmosphere.map((chem) => (
                <span
                  key={chem}
                  className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 font-mono text-[10px]"
                >
                  {chem}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Natural Satellites / Moons */}
        {childMoons.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider">
              Major Moons ({childMoons.length})
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {childMoons.map((moon) => (
                <button
                  key={moon.id}
                  onClick={() => selectBody(moon.id)}
                  className="px-2 py-1.5 bg-black/40 hover:bg-sky-500/20 border border-zinc-800 hover:border-sky-500/50 rounded flex items-center justify-between text-left transition-colors"
                >
                  <span className="text-white font-medium">🌑 {moon.name}</span>
                  <ChevronRight className="w-3 h-3 text-zinc-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Overview & Fascinating Facts */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <div className="text-zinc-300 leading-relaxed text-xs">
            {body.physical.overview}
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-amber-200/90 text-[11px] flex gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>{body.physical.funFact}</p>
          </div>
        </div>

        {/* Measurement Quick Setup */}
        <div className="pt-2 border-t border-zinc-800 flex gap-2">
          <button
            onClick={() => { setMeasurementOriginId(body.id); setIsMeasurementOpen(true); }}
            className="flex-1 px-2 py-1 text-[11px] glass-button rounded text-zinc-300 hover:text-white"
          >
            Measure from Here
          </button>
          <button
            onClick={() => { setMeasurementTargetId(body.id); setIsMeasurementOpen(true); }}
            className="flex-1 px-2 py-1 text-[11px] glass-button rounded text-zinc-300 hover:text-white"
          >
            Measure to Here
          </button>
        </div>
      </div>
    </aside>
  );
};
