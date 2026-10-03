/**
 * 3D Solar System Simulator — Real-Time Astronomical Distance Measurement Dock
 * Calculates dynamic Euclidean distances, light-travel times, and human/spacecraft flight equivalents
 * between any two celestial bodies.
 */

import React from 'react';
import { Ruler, ArrowRightLeft, X, Zap, Rocket, Plane } from 'lucide-react';
import { useSimulation } from '../../state/simulationContext';
import { CELESTIAL_BODIES, CELESTIAL_BODY_MAP } from '../../astronomy/celestialData';
import { distanceBetween } from '../../astronomy/kepler';
import { KM_PER_AU, LIGHT_SECONDS_PER_AU } from '../../astronomy/constants';

interface MeasurementToolProps {
  isOpen: boolean;
  onClose: () => void;
}

const MEASUREMENT_PRESETS = [
  { label: 'Earth ⇄ Moon', origin: 'earth', target: 'moon' },
  { label: 'Earth ⇄ Mars', origin: 'earth', target: 'mars' },
  { label: 'Sun ⇄ Earth', origin: 'sun', target: 'earth' },
  { label: 'Sun ⇄ Jupiter', origin: 'sun', target: 'jupiter' },
  { label: 'Sun ⇄ Neptune', origin: 'sun', target: 'neptune' },
];

export const MeasurementTool: React.FC<MeasurementToolProps> = ({ isOpen, onClose }) => {
  const {
    measurementOriginId,
    setMeasurementOriginId,
    measurementTargetId,
    setMeasurementTargetId,
    simulationDate,
    getBodyPosition,
  } = useSimulation();

  if (!isOpen) return null;

  const originBody = measurementOriginId ? CELESTIAL_BODY_MAP.get(measurementOriginId) : null;
  const targetBody = measurementTargetId ? CELESTIAL_BODY_MAP.get(measurementTargetId) : null;

  // Calculate live real-time Euclidean distance
  let distAU = 0;
  let distKm = 0;
  let distMiles = 0;
  let lightTimeStr = '';
  let probeTimeStr = '';
  let jetTimeStr = '';

  const originPosition = originBody
    ? getBodyPosition(originBody.id, 'real', simulationDate)
    : null;
  const targetPosition = targetBody
    ? getBodyPosition(targetBody.id, 'real', simulationDate)
    : null;

  if (originPosition && targetPosition) {
    const posA = originPosition.physicalAU;
    const posB = targetPosition.physicalAU;

    distAU = distanceBetween(posA, posB);
    distKm = distAU * KM_PER_AU;
    distMiles = distKm * 0.621371;

    // Light speed
    const totalSeconds = distAU * LIGHT_SECONDS_PER_AU;
    if (totalSeconds < 60) {
      lightTimeStr = `${totalSeconds.toFixed(1)} seconds`;
    } else if (totalSeconds < 3600) {
      const m = Math.floor(totalSeconds / 60);
      const s = Math.floor(totalSeconds % 60);
      lightTimeStr = `${m}m ${s}s`;
    } else {
      const h = (totalSeconds / 3600).toFixed(2);
      lightTimeStr = `${h} hours`;
    }

    // Space probe travel time (~58,000 km/h, Voyager/New Horizons speed)
    const probeHours = distKm / 58000;
    const probeDays = probeHours / 24;
    if (probeDays < 60) {
      probeTimeStr = `~${probeDays.toFixed(1)} days`;
    } else if (probeDays < 730) {
      probeTimeStr = `~${(probeDays / 30.4).toFixed(1)} months`;
    } else {
      probeTimeStr = `~${(probeDays / 365.25).toFixed(1)} years`;
    }

    // Commercial airliner travel time (~900 km/h)
    const jetDays = (distKm / 900) / 24;
    if (jetDays < 365) {
      jetTimeStr = `~${jetDays.toFixed(0)} days`;
    } else {
      jetTimeStr = `~${(jetDays / 365.25).toFixed(0)} years`;
    }
  }

  const swapBodies = () => {
    const temp = measurementOriginId;
    setMeasurementOriginId(measurementTargetId);
    setMeasurementTargetId(temp);
  };

  return (
    <section
      aria-label="Distance measurement"
      className="measurement-panel glass-panel rounded-xl p-3 border border-sky-500/40 shadow-glow-cyan flex flex-col gap-2.5 pointer-events-auto backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
        <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-xs tracking-wide">
          <Ruler className="w-4 h-4" />
          <span>Interplanetary Distance Meter</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close measurement"
          className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Presets Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono no-scrollbar">
        {MEASUREMENT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setMeasurementOriginId(preset.origin);
              setMeasurementTargetId(preset.target);
            }}
            className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-sky-500/20 text-zinc-300 hover:text-sky-300 border border-zinc-700/60 whitespace-nowrap transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-1.5 text-xs">
        {/* Origin Dropdown */}
        <div>
          <label
            htmlFor="measurement-origin"
            className="text-[10px] text-zinc-500 uppercase font-mono block mb-1 flex items-center gap-1"
          >
            {originBody && (
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: originBody.physical.color }}
              />
            )}
            <span>Origin</span>
          </label>
          <select
            id="measurement-origin"
            value={measurementOriginId || ''}
            onChange={(e) => setMeasurementOriginId(e.target.value || null)}
            className="w-full bg-black/60 border border-zinc-700 rounded px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-sky-500"
          >
            {CELESTIAL_BODIES.map((b) => (
              <option key={`orig-${b.id}`} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <button
          onClick={swapBodies}
          className="mt-4 p-1.5 rounded glass-button text-sky-400 hover:text-white"
          title="Swap bodies"
          aria-label="Swap origin and target bodies"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </button>

        {/* Target Dropdown */}
        <div>
          <label
            htmlFor="measurement-target"
            className="text-[10px] text-zinc-500 uppercase font-mono block mb-1 flex items-center gap-1"
          >
            {targetBody && (
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: targetBody.physical.color }}
              />
            )}
            <span>Target</span>
          </label>
          <select
            id="measurement-target"
            value={measurementTargetId || ''}
            onChange={(e) => setMeasurementTargetId(e.target.value || null)}
            className="w-full bg-black/60 border border-zinc-700 rounded px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-sky-500"
          >
            {CELESTIAL_BODIES.map((b) => (
              <option key={`targ-${b.id}`} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-time Dynamic Results */}
      {originPosition && targetPosition ? (
        <div className="bg-black/60 border border-zinc-800 rounded-lg p-2.5 space-y-2 font-mono text-xs">
          {/* Main Astronomical Distance */}
          <div className="flex justify-between items-baseline border-b border-zinc-800/80 pb-1.5">
            <span className="text-zinc-400 text-[11px]">Euclidean Distance:</span>
            <div className="text-right">
              <span className="text-sky-300 font-bold text-sm block">
                {distAU.toFixed(4)} AU
              </span>
              <span className="text-white text-[11px] block">
                {(distKm / 1e6).toFixed(3)}M km ({distKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km)
              </span>
            </div>
          </div>

          {/* Travel Times Comparison Breakdown */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between items-center text-amber-300">
              <span className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3 h-3" /> Light Speed:
              </span>
              <span className="font-semibold">{lightTimeStr}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span className="flex items-center gap-1 text-sky-400">
                <Rocket className="w-3 h-3" /> Deep Space Probe (58k km/h):
              </span>
              <span>{probeTimeStr}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span className="flex items-center gap-1 text-zinc-400">
                <Plane className="w-3 h-3" /> Jet Airliner (900 km/h):
              </span>
              <span>{jetTimeStr}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-zinc-400 text-center py-2 bg-black/30 rounded border border-zinc-800">
          Position unavailable. Select two supported celestial bodies to measure distance.
        </div>
      )}
    </section>
  );
};
