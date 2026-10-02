/**
 * 3D Solar System Simulator — Real-Time Astronomical Distance Measurement Dock
 * Calculates dynamic Euclidean distances and light-travel times between any two celestial bodies.
 */

import React from 'react';
import { Ruler, ArrowRightLeft, X, Zap } from 'lucide-react';
import { useSimulation } from '../../state/simulationContext';
import { CELESTIAL_BODIES, CELESTIAL_BODY_MAP } from '../../astronomy/celestialData';
import { calculateEphemeris, distanceBetween } from '../../astronomy/kepler';
import { KM_PER_AU, LIGHT_SECONDS_PER_AU } from '../../astronomy/constants';

interface MeasurementToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MeasurementTool: React.FC<MeasurementToolProps> = ({ isOpen, onClose }) => {
  const {
    measurementOriginId,
    setMeasurementOriginId,
    measurementTargetId,
    setMeasurementTargetId,
    simulationDate,
  } = useSimulation();

  if (!isOpen) return null;

  const originBody = measurementOriginId ? CELESTIAL_BODY_MAP.get(measurementOriginId) : null;
  const targetBody = measurementTargetId ? CELESTIAL_BODY_MAP.get(measurementTargetId) : null;

  // Calculate live real-time Euclidean distance
  let distAU = 0;
  let distKm = 0;
  let distMiles = 0;
  let lightTimeStr = '';

  if (originBody && targetBody && originBody.id !== targetBody.id) {
    const posA = originBody.id === 'sun'
      ? { x: 0, y: 0, z: 0 }
      : originBody.orbitalElements
      ? calculateEphemeris(originBody.orbitalElements, simulationDate).positionAU
      : { x: 0, y: 0, z: 0 };

    const posB = targetBody.id === 'sun'
      ? { x: 0, y: 0, z: 0 }
      : targetBody.orbitalElements
      ? calculateEphemeris(targetBody.orbitalElements, simulationDate).positionAU
      : { x: 0, y: 0, z: 0 };

    distAU = distanceBetween(posA, posB);
    distKm = distAU * KM_PER_AU;
    distMiles = distKm * 0.621371;

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
  }

  const swapBodies = () => {
    const temp = measurementOriginId;
    setMeasurementOriginId(measurementTargetId);
    setMeasurementTargetId(temp);
  };

  return (
    <div className="absolute top-16 left-4 z-20 w-80 glass-panel rounded-xl p-3 border border-sky-500/40 shadow-glow-cyan flex flex-col gap-2.5 pointer-events-auto backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
        <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-xs tracking-wide">
          <Ruler className="w-4 h-4" />
          <span>Interplanetary Distance Meter</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-1.5 text-xs">
        {/* Origin Dropdown */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">
            Origin
          </label>
          <select
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
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </button>

        {/* Target Dropdown */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">
            Target
          </label>
          <select
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
      {originBody && targetBody && originBody.id !== targetBody.id ? (
        <div className="bg-black/60 border border-zinc-800 rounded-lg p-2.5 space-y-1.5 font-mono text-xs">
          <div className="flex justify-between items-baseline">
            <span className="text-zinc-400 text-[11px]">Distance:</span>
            <span className="text-sky-300 font-bold text-sm">
              {distAU.toFixed(4)} AU
            </span>
          </div>

          <div className="flex justify-between items-baseline text-[11px]">
            <span className="text-zinc-400">Kilometers:</span>
            <span className="text-white">
              {(distKm / 1e6).toFixed(3)} Million km
            </span>
          </div>

          <div className="flex justify-between items-baseline text-[11px]">
            <span className="text-zinc-400">Miles:</span>
            <span className="text-zinc-300">
              {(distMiles / 1e6).toFixed(3)} Million mi
            </span>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-zinc-800 text-[11px]">
            <span className="text-amber-400 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Light Travel:
            </span>
            <span className="text-amber-300 font-semibold">{lightTimeStr}</span>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-zinc-400 text-center py-2 bg-black/30 rounded border border-zinc-800">
          Select two different celestial bodies to measure real-time distance.
        </div>
      )}
    </div>
  );
};
