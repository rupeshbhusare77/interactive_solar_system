/**
 * 3D Solar System Simulator — Real-Time Astronomical Telemetry & Information Panel
 * Displays live dynamically calculated distances, orbital velocity, light travel times,
 * and comprehensive physical and orbital NASA specifications with comparative infographics.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  Zap,
  Radio,
  Ruler,
  Maximize2,
  ChevronRight,
  Info,
  Flame,
  Wind,
  Orbit,
  Thermometer,
  Scale,
} from 'lucide-react';
import { useSimulation } from '../../state/simulationContext';
import { CELESTIAL_BODY_MAP, MOONS } from '../../astronomy/celestialData';
import { distanceBetween, dateToJulianDate } from '../../astronomy/kepler';
import { KM_PER_AU, LIGHT_SECONDS_PER_AU } from '../../astronomy/constants';

type InfoTab = 'overview' | 'telemetry' | 'physical' | 'orbital';

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

  const [activeTab, setActiveTab] = useState<InfoTab>('overview');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
    setActiveTab('overview');
  }, [selectedBodyId]);

  if (!isInfoOpen || !selectedBodyId) return null;

  const body = CELESTIAL_BODY_MAP.get(selectedBodyId);
  if (!body) return null;

  const orbit = body.orbitalElements ?? body.moonOrbitalElements;
  const julianDate = dateToJulianDate(simulationDate);
  const outsideLocalModel =
    !!orbit?.modelRangeJD &&
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
    distToEarthAU =
      earthPosition && targetPosition
        ? distanceBetween(targetPosition.physicalAU, earthPosition.physicalAU)
        : NaN;

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
  const perihelionAU = body.orbitalElements
    ? body.orbitalElements.a * (1 - body.orbitalElements.e)
    : null;
  const aphelionAU = body.orbitalElements
    ? body.orbitalElements.a * (1 + body.orbitalElements.e)
    : null;

  // Earth comparative ratios
  const earthRadiusKm = 6371.0;
  const sizeRatioToEarth = (body.physical.radiusKm / earthRadiusKm).toFixed(2);
  const earthGravity = 9.807;
  const gravityRatioToEarth = (body.physical.gravityMs2 / earthGravity).toFixed(2);
  const gravityBarPercent = Math.min(
    Math.max((body.physical.gravityMs2 / 28) * 100, 5),
    100
  );

  // Temperature gauge clamp between -250C and 500C
  const tempClamped = Math.min(Math.max(body.physical.meanTempC, -250), 500);
  const tempGaugePercent = ((tempClamped - -250) / 750) * 100;

  return (
    <aside
      aria-label={`${body.name} information`}
      data-expanded={isExpanded}
      className="info-panel hud-inspector glass-panel rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden pointer-events-auto backdrop-blur-xl"
    >
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

        <div className="flex items-center gap-1.5">
          <button
            aria-expanded={isExpanded}
            aria-controls="body-details"
            onClick={() => setIsExpanded(!isExpanded)}
            className="panel-expand glass-button rounded px-2 py-1 text-xs"
          >
            {isExpanded ? 'Collapse' : 'Details'}
          </button>
          <button
            onClick={() => setIsInfoOpen(false)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close telemetry panel"
            aria-label="Close telemetry panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        role="tablist"
        aria-label="Information categories"
        className="flex items-center border-b border-zinc-800 bg-black/40 px-2 pt-1.5 gap-1 text-[11px]"
      >
        {[
          { id: 'overview', label: 'Overview', icon: Info },
          { id: 'telemetry', label: 'Telemetry', icon: Radio },
          { id: 'physical', label: 'Physical', icon: Zap },
          { id: 'orbital', label: 'Orbit & Science', icon: Orbit },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id as InfoTab)}
              className={`flex-1 py-1.5 px-2 rounded-t-lg flex items-center justify-center gap-1 font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-800/90 text-sky-300 border-t border-x border-zinc-700 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Content Body */}
      <div
        id="body-details"
        className="panel-body min-h-0 flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans"
      >
        {/* Quick Camera Navigation Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setCameraMode('focus')}
            className="px-2.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all text-xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Focus Camera</span>
          </button>
          <button
            onClick={() => setCameraMode('follow')}
            className="px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all text-xs"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Lock & Follow</span>
          </button>
        </div>

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-3.5">
            {/* Earth Comparative Badges */}
            <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
              <div className="p-2 rounded-lg bg-black/40 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block">Radius vs Earth</span>
                <span className="text-white font-bold text-xs">{sizeRatioToEarth}×</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block">Gravity vs Earth</span>
                <span className="text-sky-300 font-bold text-xs">{gravityRatioToEarth}g</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block">Mean Temp</span>
                <span className="text-amber-300 font-bold text-xs">{body.physical.meanTempC}°C</span>
              </div>
            </div>

            {/* Overview Narrative */}
            <div className="text-zinc-300 leading-relaxed text-xs bg-black/30 p-3 rounded-lg border border-zinc-800/80">
              {body.physical.overview}
            </div>

            {/* Fun Fact Card */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-amber-200/90 text-[11px] flex gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>{body.physical.funFact}</p>
            </div>

            {/* Child Moons Section */}
            {childMoons.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <h3 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider">
                  Major Natural Satellites ({childMoons.length})
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

            {/* Quick Measurement Actions */}
            <div className="pt-2 border-t border-zinc-800 flex gap-2">
              <button
                onClick={() => {
                  setMeasurementOriginId(body.id);
                  setIsMeasurementOpen(true);
                }}
                className="flex-1 px-2.5 py-1.5 text-[11px] glass-button rounded-lg text-zinc-300 hover:text-white"
              >
                Measure from Here
              </button>
              <button
                onClick={() => {
                  setMeasurementTargetId(body.id);
                  setIsMeasurementOpen(true);
                }}
                className="flex-1 px-2.5 py-1.5 text-[11px] glass-button rounded-lg text-zinc-300 hover:text-white"
              >
                Measure to Here
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: LIVE TELEMETRY ================= */}
        {activeTab === 'telemetry' && (
          <div className="space-y-3.5">
            <div className="bg-black/50 border border-zinc-800 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between text-zinc-400 font-mono text-[10px] uppercase tracking-wider border-b border-zinc-800 pb-1.5">
                <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Dynamic Telemetry
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  REAL-TIME
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                {ephemeris && (
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Distance to Sun</span>
                    <span className="text-white font-bold text-sm">
                      {ephemeris.distanceAU.toFixed(3)} AU
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      {((ephemeris.distanceAU * KM_PER_AU) / 1e6).toFixed(2)}M km
                    </span>
                  </div>
                )}

                {body.id !== 'earth' && (
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Distance to Earth</span>
                    <span className="text-white font-bold text-sm">
                      {Number.isFinite(distToEarthAU)
                        ? `${distToEarthAU.toFixed(3)} AU`
                        : 'Unavailable'}
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
                      <span className="text-white font-semibold text-xs">
                        {ephemeris.trueAnomalyDeg.toFixed(1)}°
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Heliocentric Long</span>
                      <span className="text-white font-semibold text-xs">
                        {ephemeris.heliocentricLongitudeDeg.toFixed(1)}°
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Heliocentric Position Vector */}
            {ephemeris && (
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider">
                  Heliocentric 3D Vector (AU)
                </h3>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px] text-center">
                  <div className="p-2 rounded bg-black/40 border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 block">X</span>
                    <span className="text-sky-300 font-semibold">{ephemeris.positionAU.x.toFixed(3)}</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 block">Y</span>
                    <span className="text-sky-300 font-semibold">{ephemeris.positionAU.y.toFixed(3)}</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 block">Z</span>
                    <span className="text-sky-300 font-semibold">{ephemeris.positionAU.z.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: PHYSICAL & ATMOSPHERE ================= */}
        {activeTab === 'physical' && (
          <div className="space-y-4">
            {/* Visual Temperature Gauge */}
            <div className="space-y-1.5 bg-black/40 p-3 rounded-lg border border-zinc-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 flex items-center gap-1 font-semibold">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Mean Surface Temperature
                </span>
                <span className="font-mono text-white font-bold">
                  {body.physical.meanTempC}°C
                </span>
              </div>
              <div className="relative w-full h-2.5 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-400 via-emerald-400 via-amber-400 to-rose-600">
                {/* Marker pointer */}
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-white ring-1 ring-black rounded-full transition-all"
                  style={{ left: `calc(${tempGaugePercent}% - 3px)` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                <span>-250°C</span>
                <span>0°C</span>
                <span>100°C</span>
                <span>+500°C</span>
              </div>
            </div>

            {/* Gravity Infographic */}
            <div className="space-y-1.5 bg-black/40 p-3 rounded-lg border border-zinc-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-semibold">Surface Gravity</span>
                <span className="font-mono text-white font-bold">
                  {body.physical.gravityMs2} m/s² ({gravityRatioToEarth}g)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all"
                  style={{ width: `${gravityBarPercent}%` }}
                />
              </div>
            </div>

            {/* Physical Characteristics Table */}
            <div className="space-y-1.5">
              <h3 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider">
                Full Physical Specifications
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
              </div>
            </div>

            {/* Atmosphere Composition Breakdown */}
            {body.physical.atmosphere && body.physical.atmosphere.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-sky-400" /> Atmosphere Composition
                </h3>
                <div className="space-y-1 bg-black/30 p-2.5 rounded-lg border border-zinc-800">
                  {body.physical.atmosphere.map((chem) => (
                    <div key={chem} className="flex items-center justify-between text-zinc-300 font-mono text-[11px]">
                      <span>{chem}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: ORBIT & SCIENCE MODEL ================= */}
        {activeTab === 'orbital' && (
          <div className="space-y-3.5">
            {/* Keplerian Elements Table */}
            {body.orbitalElements && (
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider">
                  Fixed Keplerian Orbital Elements
                </h3>
                <div className="bg-black/30 border border-zinc-800/80 rounded-lg divide-y divide-zinc-800/60 font-mono text-[11px]">
                  <div className="px-2.5 py-1.5 flex justify-between">
                    <span className="text-zinc-400">Semi-major Axis (a)</span>
                    <span className="text-white font-medium">{body.orbitalElements.a} AU</span>
                  </div>
                  <div className="px-2.5 py-1.5 flex justify-between">
                    <span className="text-zinc-400">Eccentricity (e)</span>
                    <span className="text-white font-medium">{body.orbitalElements.e}</span>
                  </div>
                  <div className="px-2.5 py-1.5 flex justify-between">
                    <span className="text-zinc-400">Inclination (i)</span>
                    <span className="text-white font-medium">{body.orbitalElements.i}°</span>
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
                      <span className="text-white font-medium">{perihelionAU.toFixed(3)} AU</span>
                    </div>
                  )}
                  {aphelionAU && (
                    <div className="px-2.5 py-1.5 flex justify-between">
                      <span className="text-zinc-400">Aphelion</span>
                      <span className="text-white font-medium">{aphelionAU.toFixed(3)} AU</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Model and Accuracy Disclosure */}
            <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5 text-[11px] text-zinc-300">
              <h3 className="font-semibold text-amber-300">Model and accuracy</h3>
              <p>
                Educational approximation. UTC timestamps approximate dynamical time;
                perturbations and precise surface orientation are omitted.
              </p>
              {orbit ? (
                <>
                  <p>
                    Epoch: JD {orbit.epochJD ?? 'unavailable'} · Plane:{' '}
                    {orbit.referencePlane === 'parent-equator'
                      ? 'parent equator (static illustrative pole)'
                      : 'J2000 ecliptic'}
                  </p>
                  <p>
                    Provenance: {orbit.provenance?.status ?? 'unverified'}.{' '}
                    {orbit.provenance?.note}
                  </p>
                  {orbit.modelRangeJD && (
                    <p>
                      Local model interval: JD {orbit.modelRangeJD[0]}–
                      {orbit.modelRangeJD[1]}.{' '}
                      {outsideLocalModel
                        ? 'This date is outside that interval; propagation is illustrative.'
                        : 'This interval is not an accuracy guarantee.'}
                    </p>
                  )}
                  {orbit.provenance?.sourceUrls.map((url, index) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block underline text-sky-300"
                    >
                      Orbital source {index + 1}
                    </a>
                  ))}
                  {!orbit.provenance?.sourceUrls.length && (
                    <p>No verified record-level orbital source is available.</p>
                  )}
                </>
              ) : (
                <p>
                  The Sun is the heliocentric origin. Its surface rotation and texture
                  orientation are illustrative.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </aside>
  );
};
