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
import { JPL_CATALOG } from '../../astronomy/scienceCatalog';
import { SURFACE_MAPS } from '../../astronomy/generated/surfaceMaps';
import { referenceStatus } from '../../astronomy/referenceEphemeris';
import { illuminatedFraction, diskOverlap, barycenter } from '../../astronomy/phenomena';
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
  const [moonQuery,setMoonQuery]=useState('');
  const [majorOnly,setMajorOnly]=useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
    setMoonQuery('');
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

  const filteredMoons=childMoons.filter(moon=>(!majorOnly || moon.physical.radiusKm>=100) && moon.name.toLowerCase().includes(moonQuery.toLowerCase()));
  const discoveryCount=JPL_CATALOG.discoveries.filter(record=>record.parent===body.id).length;
  const missingMoons=JPL_CATALOG.discoveries.filter(record=>record.parent===body.id && !childMoons.some(moon=>moon.name.toLowerCase().replace(/[^a-z0-9]/g,'')===record.name.toLowerCase().replace(/[^a-z0-9]/g,'')));
  const surface=SURFACE_MAPS.find(map=>map.id===body.id);
  const position=getBodyPosition(body.id,'real',simulationDate)?.physicalAU;
  const earth=getBodyPosition('earth','real',simulationDate)?.physicalAU;
  const sun={x:0,y:0,z:0};
  const phase=position && earth ? illuminatedFraction(position,sun,earth) : null;
  const parent=body.parentId ? CELESTIAL_BODY_MAP.get(body.parentId) : undefined;
  const parentPosition=parent ? getBodyPosition(parent.id,'real',simulationDate)?.physicalAU : undefined;
  const eclipse=position && parentPosition && parent ? diskOverlap(position,sun,695700/KM_PER_AU,parentPosition,parent.physical.radiusKm/KM_PER_AU) : null;
  const transit=earth && position && parentPosition && parent ? diskOverlap(earth,parentPosition,parent.physical.radiusKm/KM_PER_AU,position,body.physical.radiusKm/KM_PER_AU) : null;
  const center=position && parentPosition && parent ? barycenter(parentPosition,parent.physical.massKg,position,body.physical.massKg) : null;
  const format=(value:number,unit='',digits?:number)=>Number.isFinite(value) ? (digits===undefined?String(value):value.toFixed(digits))+unit : 'Unknown';
  // Perihelion and Aphelion if orbital elements present
  const perihelionAU = body.orbitalElements
    ? body.orbitalElements.a * (1 - body.orbitalElements.e)
    : null;
  const aphelionAU = body.orbitalElements
    ? body.orbitalElements.a * (1 + body.orbitalElements.e)
    : null;

  // Earth comparative ratios
  const earthRadiusKm = 6371.0;
  const sizeRatioToEarth = format(body.physical.radiusKm / earthRadiusKm,'',2);
  const earthGravity = 9.807;
  const gravityRatioToEarth = format(body.physical.gravityMs2 / earthGravity,'',2);
  const gravityBarPercent = Number.isFinite(body.physical.gravityMs2) ? Math.min(
    Math.max((body.physical.gravityMs2 / 28) * 100, 5),
    100
  ) : 0;

  // Temperature gauge clamp between -250C and 500C
  const tempClamped = Math.min(Math.max(body.physical.meanTempC, -250), 500);
  const tempGaugePercent = Number.isFinite(tempClamped) ? ((tempClamped + 250) / 750) * 100 : 0;

  return (
    <aside
      aria-label={`${body.name} information`}
      data-expanded={isExpanded}
      className="info-panel hud-inspector glass-panel rounded-xl border border-ui-line shadow-2xl flex flex-col overflow-hidden pointer-events-auto backdrop-blur-xl"
    >
      {/* Header Bar */}
      <div
        className="px-4 py-3 border-b border-ui-line flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-3.5 h-3.5 rounded-full shadow-md shrink-0"
            style={{ backgroundColor: body.physical.color }}
          />
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h2 className="text-base font-bold text-ui-primary tracking-wide">
              {body.name}
            </h2>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-ui-inset text-ui-muted rounded border border-ui-line/50 shrink-0">
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
            className="p-1 rounded text-ui-muted hover:text-ui-primary hover:bg-ui-inset transition-colors"
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
        className="flex items-center border-b border-ui-line bg-ui-inset px-2 pt-1.5 gap-1 text-[11px]"
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
                  ? 'bg-ui-inset text-ui-accent border-t border-x border-ui-line font-semibold'
                  : 'text-ui-muted hover:text-ui-primary hover:bg-ui-inset'
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
            className="px-2.5 py-1.5 bg-ui-selected hover:bg-ui-selected text-ui-accent border border-ui-line rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all text-xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Focus Camera</span>
          </button>
          <button
            onClick={() => setCameraMode('follow')}
            className="px-2.5 py-1.5 bg-ui-selected hover:bg-ui-selected text-ui-accent border border-ui-line rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all text-xs"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Lock & Follow</span>
          </button>
        </div>

        <section aria-label="Scientific accuracy" className="rounded-lg border border-ui-line p-2 text-[11px] space-y-1">
          <p>{referenceStatus(body.id,simulationDate)}</p>
          <p>{surface?.appearance ?? body.science?.appearance ?? 'Illustrative appearance.'}</p>
          <p>Other legacy physical fields retain unverified provenance. Unknown measurements are not inferred.</p>
          <p>Orientation uses polynomial IAU constants where available; periodic terms, libration, and texture registration remain approximate.</p>
          {surface && <a className="underline text-ui-accent" href={surface.source} target="_blank" rel="noreferrer">Surface map and credits</a>}
          {body.id==='saturn' && <p>Circular D–F ring boundaries are sourced from <a className="underline text-ui-accent" href="https://pds-rings.seti.org/saturn/saturn_tables.html" target="_blank" rel="noreferrer">NASA PDS</a>. Optical depth, color, and scattering remain approximations; faint outer rings are omitted.</p>}
          {body.parentId && <p>Parent: {referenceStatus(body.parentId,simulationDate)}</p>}
          {body.science && <a className="underline text-ui-accent block" href={body.science.physicalSource} target="_blank" rel="noreferrer">{body.type==='moon'?'Satellite physical data source':'Dimensions and orientation source'}</a>}
        </section>
        {body.type!=='star' && <section aria-label="Physical geometry" className="rounded-lg border border-ui-line p-2 text-[11px] space-y-1">
          <p>Illumination from Earth: {phase===null?'Unavailable':(phase*100).toFixed(1)+'%'}</p>
          {eclipse && <p>Sun blocked by parent at moon center: {eclipse}</p>}
          {transit && <p>Moon over parent disk from Earth: {transit}</p>}
          {center && parentPosition && <p>Pair barycenter offset from parent: {(distanceBetween(center,parentPosition)*KM_PER_AU).toFixed(1)} km</p>}
          <p>Geometric spherical-body diagnostic at the selected time; no atmospheric refraction or light-time correction. Accuracy follows the position model.</p>
        </section>}
        {childMoons.length>0 && <button className="glass-button rounded px-2 py-1" onClick={()=>setCameraMode('system')}>Explore Moon System</button>}
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-3.5">
            {/* Earth Comparative Badges */}
            <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
              <div className="p-2 rounded-lg bg-ui-inset border border-ui-line">
                <span className="text-[10px] text-ui-muted uppercase block">Radius vs Earth</span>
                <span className="text-ui-primary font-bold text-xs">{sizeRatioToEarth==='Unknown'?'Unknown':sizeRatioToEarth+'×'}</span>
              </div>
              <div className="p-2 rounded-lg bg-ui-inset border border-ui-line">
                <span className="text-[10px] text-ui-muted uppercase block">Gravity vs Earth</span>
                <span className="text-ui-accent font-bold text-xs">{gravityRatioToEarth==='Unknown'?'Unknown':gravityRatioToEarth+'g'}</span>
              </div>
              <div className="p-2 rounded-lg bg-ui-inset border border-ui-line">
                <span className="text-[10px] text-ui-muted uppercase block">Mean Temp</span>
                <span className="text-ui-warning font-bold text-xs">{format(body.physical.meanTempC,'°C')}</span>
              </div>
            </div>

            {/* Overview Narrative */}
            <div className="text-ui-secondary leading-relaxed text-xs bg-ui-inset p-3 rounded-lg border border-ui-line">
              {body.physical.overview}
            </div>

            {/* Fun Fact Card */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-ui-warning text-[11px] flex gap-2">
              <Info className="w-4 h-4 text-ui-warning shrink-0 mt-0.5" />
              <p>{body.physical.funFact}</p>
            </div>

            {/* Child Moons Section */}
            {childMoons.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <h3 className="text-[11px] font-semibold uppercase text-ui-muted tracking-wider">
                  Natural Satellites ({discoveryCount || childMoons.length} cataloged; {childMoons.length} with orbital data)
                </h3>
                <input aria-label="Filter moons" placeholder="Filter moons…" value={moonQuery} onChange={event=>setMoonQuery(event.target.value)} className="w-full rounded bg-ui-inset border border-ui-line px-2 py-1"/>
                <label className="flex gap-2"><input type="checkbox" checked={majorOnly} onChange={event=>setMajorOnly(event.target.checked)}/>Only moons with measured mean radius ≥ 100 km</label>
                <p className="text-ui-muted">JPL catalog verified {JPL_CATALOG.verifiedOn}. Small dots are navigation markers.</p>
                <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto">
                  {filteredMoons.map((moon) => (
                    <button
                      key={moon.id}
                      onClick={() => selectBody(moon.id)}
                      className="px-2 py-1.5 bg-ui-inset hover:bg-ui-selected border border-ui-line hover:border-ui-line rounded flex items-center justify-between text-left transition-colors"
                    >
                      <span className="text-ui-primary font-medium">🌑 {moon.name}</span>
                      <ChevronRight className="w-3 h-3 text-ui-muted" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {missingMoons.length>0 && <p className="text-ui-muted">Discovery records without bundled orbital data: {missingMoons.map(record=>record.name).join(', ')}. No position is invented.</p>}
            {/* Quick Measurement Actions */}
            <div className="pt-2 border-t border-ui-line flex gap-2">
              <button
                onClick={() => {
                  setMeasurementOriginId(body.id);
                  setIsMeasurementOpen(true);
                }}
                className="flex-1 px-2.5 py-1.5 text-[11px] glass-button rounded-lg text-ui-secondary hover:text-ui-primary"
              >
                Measure from Here
              </button>
              <button
                onClick={() => {
                  setMeasurementTargetId(body.id);
                  setIsMeasurementOpen(true);
                }}
                className="flex-1 px-2.5 py-1.5 text-[11px] glass-button rounded-lg text-ui-secondary hover:text-ui-primary"
              >
                Measure to Here
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: LIVE TELEMETRY ================= */}
        {activeTab === 'telemetry' && (
          <div className="space-y-3.5">
            <div className="bg-ui-inset border border-ui-line rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between text-ui-muted font-mono text-[10px] uppercase tracking-wider border-b border-ui-line pb-1.5">
                <span className="flex items-center gap-1.5 text-ui-accent font-bold">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Dynamic Telemetry
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-ui-success border border-emerald-500/30">
                  REAL-TIME
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                {ephemeris && (
                  <div>
                    <span className="text-[10px] text-ui-muted block">Distance to Sun</span>
                    <span className="text-ui-primary font-bold text-sm">
                      {ephemeris.distanceAU.toFixed(3)} AU
                    </span>
                    <span className="text-[10px] text-ui-muted block">
                      {((ephemeris.distanceAU * KM_PER_AU) / 1e6).toFixed(2)}M km
                    </span>
                  </div>
                )}

                {body.id !== 'earth' && (
                  <div>
                    <span className="text-[10px] text-ui-muted block">Distance to Earth</span>
                    <span className="text-ui-primary font-bold text-sm">
                      {Number.isFinite(distToEarthAU)
                        ? `${distToEarthAU.toFixed(3)} AU`
                        : 'Unavailable'}
                    </span>
                    <span className="text-[10px] text-ui-warning block">
                      ⚡ {lightTimeToEarth}
                    </span>
                  </div>
                )}

                {ephemeris && (
                  <>
                    <div>
                      <span className="text-[10px] text-ui-muted block">Approximate model anomaly (ν)</span>
                      <span className="text-ui-primary font-semibold text-xs">
                        {ephemeris.trueAnomalyDeg.toFixed(1)}°
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ui-muted block">Heliocentric Long</span>
                      <span className="text-ui-primary font-semibold text-xs">
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
                <h3 className="text-[11px] font-semibold uppercase text-ui-muted tracking-wider">
                  Heliocentric 3D Vector (AU)
                </h3>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px] text-center">
                  <div className="p-2 rounded bg-ui-inset border border-ui-line">
                    <span className="text-[9px] text-ui-muted block">X</span>
                    <span className="text-ui-accent font-semibold">{ephemeris.positionAU.x.toFixed(3)}</span>
                  </div>
                  <div className="p-2 rounded bg-ui-inset border border-ui-line">
                    <span className="text-[9px] text-ui-muted block">Y</span>
                    <span className="text-ui-accent font-semibold">{ephemeris.positionAU.y.toFixed(3)}</span>
                  </div>
                  <div className="p-2 rounded bg-ui-inset border border-ui-line">
                    <span className="text-[9px] text-ui-muted block">Z</span>
                    <span className="text-ui-accent font-semibold">{ephemeris.positionAU.z.toFixed(3)}</span>
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
            <div className="space-y-1.5 bg-ui-inset p-3 rounded-lg border border-ui-line">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-ui-muted flex items-center gap-1 font-semibold">
                  <Thermometer className="w-3.5 h-3.5 text-ui-warning" /> Mean Surface Temperature
                </span>
                <span className="font-mono text-ui-primary font-bold">
                  {format(body.physical.meanTempC,'°C')}
                </span>
              </div>
              <div className="relative w-full h-2.5 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-400 via-emerald-400 via-amber-400 to-rose-600">
                {/* Marker pointer */}
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-white ring-1 ring-black rounded-full transition-all"
                  style={{ left: `calc(${tempGaugePercent}% - 3px)` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-ui-muted">
                <span>-250°C</span>
                <span>0°C</span>
                <span>100°C</span>
                <span>+500°C</span>
              </div>
            </div>

            {/* Gravity Infographic */}
            <div className="space-y-1.5 bg-ui-inset p-3 rounded-lg border border-ui-line">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-ui-muted font-semibold">Surface Gravity</span>
                <span className="font-mono text-ui-primary font-bold">
                  {format(body.physical.gravityMs2,' m/s²')} ({gravityRatioToEarth}g)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-ui-inset overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all"
                  style={{ width: `${gravityBarPercent}%` }}
                />
              </div>
            </div>

            {/* Physical Characteristics Table */}
            <div className="space-y-1.5">
              <h3 className="text-[11px] font-semibold uppercase text-ui-muted tracking-wider">
                Full Physical Specifications
              </h3>
              <div className="bg-ui-inset border border-ui-line rounded-lg divide-y divide-ui-line font-mono text-[11px]">
                <div className="px-2.5 py-1.5 flex justify-between">
                  <span className="text-ui-muted">Mean Radius</span>
                  <span className="text-ui-primary font-medium">
                    {format(body.physical.radiusKm,' km')}
                  </span>
                </div>
                <div className="px-2.5 py-1.5 flex justify-between">
                  <span className="text-ui-muted">Mass</span>
                  <span className="text-ui-primary font-medium">
                    {Number.isFinite(body.physical.massKg)?body.physical.massKg.toExponential(3)+' kg':'Unknown'}
                  </span>
                </div>
                <div className="px-2.5 py-1.5 flex justify-between">
                  <span className="text-ui-muted">Mean Density</span>
                  <span className="text-ui-primary font-medium">
                    {format(body.physical.densityGcm3,' g/cm³')}
                  </span>
                </div>
                <div className="px-2.5 py-1.5 flex justify-between">
                  <span className="text-ui-muted">Escape Velocity</span>
                  <span className="text-ui-primary font-medium">
                    {format(body.physical.escapeVelocityKms,' km/s')}
                  </span>
                </div>
                <div className="px-2.5 py-1.5 flex justify-between">
                  <span className="text-ui-muted">Rotation Period</span>
                  <span className="text-ui-primary font-medium">
                    {format(Math.abs(body.physical.rotationPeriodHours),' hrs')}
                    {retrogradeSpin ? ' (Retrograde)' : ''}
                  </span>
                </div>
                <div className="px-2.5 py-1.5 flex justify-between">
                  <span className="text-ui-muted">Axial Tilt</span>
                  <span className="text-ui-primary font-medium">
                    {format(body.physical.axialTiltDeg,'°')}
                  </span>
                </div>
              </div>
            </div>

            {/* Atmosphere Composition Breakdown */}
            {body.physical.atmosphere && body.physical.atmosphere.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-semibold uppercase text-ui-muted tracking-wider flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-ui-accent" /> Atmosphere Composition
                </h3>
                <div className="space-y-1 bg-ui-inset p-2.5 rounded-lg border border-ui-line">
                  {body.physical.atmosphere.map((chem) => (
                    <div key={chem} className="flex items-center justify-between text-ui-secondary font-mono text-[11px]">
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
                <h3 className="text-[11px] font-semibold uppercase text-ui-muted tracking-wider">
                  Fixed Keplerian Orbital Elements
                </h3>
                <div className="bg-ui-inset border border-ui-line rounded-lg divide-y divide-zinc-800/60 font-mono text-[11px]">
                  <div className="px-2.5 py-1.5 flex justify-between">
                    <span className="text-ui-muted">Semi-major Axis (a)</span>
                    <span className="text-ui-primary font-medium">{body.orbitalElements.a} AU</span>
                  </div>
                  <div className="px-2.5 py-1.5 flex justify-between">
                    <span className="text-ui-muted">Eccentricity (e)</span>
                    <span className="text-ui-primary font-medium">{body.orbitalElements.e}</span>
                  </div>
                  <div className="px-2.5 py-1.5 flex justify-between">
                    <span className="text-ui-muted">Inclination (i)</span>
                    <span className="text-ui-primary font-medium">{body.orbitalElements.i}°</span>
                  </div>
                  <div className="px-2.5 py-1.5 flex justify-between">
                    <span className="text-ui-muted">Orbital Period</span>
                    <span className="text-ui-primary font-medium">
                      {body.orbitalElements.periodDays.toFixed(1)} days (
                      {(body.orbitalElements.periodDays / 365.256).toFixed(2)} yrs)
                    </span>
                  </div>
                  {perihelionAU && (
                    <div className="px-2.5 py-1.5 flex justify-between">
                      <span className="text-ui-muted">Perihelion</span>
                      <span className="text-ui-primary font-medium">{perihelionAU.toFixed(3)} AU</span>
                    </div>
                  )}
                  {aphelionAU && (
                    <div className="px-2.5 py-1.5 flex justify-between">
                      <span className="text-ui-muted">Aphelion</span>
                      <span className="text-ui-primary font-medium">{aphelionAU.toFixed(3)} AU</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Model and Accuracy Disclosure */}
            <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5 text-[11px] text-ui-secondary">
              <h3 className="font-semibold text-ui-warning">Model and accuracy</h3>
              <p>
                Reference interpolation is used within bundled coverage after loading. Outside it, fixed-element propagation is approximate; the model does not predict event times.
              </p>
              {orbit ? (
                <>
                  <p>
                    Epoch: JD {orbit.epochJD ?? 'unavailable'} · Plane:{' '}
                    {orbit.referencePlane === 'parent-equator'
                      ? 'parent equator'
                      : orbit.referencePlane === 'laplace' ? 'local Laplace plane (sourced pole)' : 'J2000 ecliptic'}
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
                      className="block underline text-ui-accent"
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
