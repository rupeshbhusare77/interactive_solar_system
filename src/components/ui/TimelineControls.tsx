/**
 * 3D Solar System Simulator — Mission Control Timeline & Simulation Clock
 * Features play/pause, reverse time, speed multipliers (1x to 10yr/s),
 * calendar date picker, and historical event quick jumps.
 */

import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Calendar,
  Clock,
  Sparkles,
  ChevronUp,
} from 'lucide-react';
import { useSimulation } from '../../state/simulationContext';
import { HISTORIC_EVENTS } from '../../astronomy/constants';
import { dateToJulianDate } from '../../astronomy/kepler';
import { SIMULATION_MIN_DATE, SIMULATION_MAX_DATE, SIMULATION_DATE_RANGE_LABEL } from '../../astronomy/modelContract';

const SPEED_PRESETS = [
  { label: 'Real', value: 1 },
  { label: '1 hr/s', value: 3600 },
  { label: '1 day/s', value: 86400 },
  { label: '10 d/s', value: 864000 },
  { label: '30 d/s', value: 2592000 },
  { label: '1 yr/s', value: 31536000 },
  { label: '10 yr/s', value: 315360000 },
];

export const TimelineControls: React.FC = () => {
  const {
    simulationDate,
    setSimulationDate,
    dateError,
    isPlaying,
    togglePlay,
    speedMultiplier,
    setSpeedMultiplier,
    stepTime,
    resetToNow,
    selectBody,
    setCameraMode,
  } = useSimulation();

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isEventsOpen, setIsEventsOpen] = useState(false);

  const julianDate = dateToJulianDate(simulationDate);
  const isReversed = speedMultiplier < 0;
  const currentSpeedAbs = Math.abs(speedMultiplier);

  const toggleReverse = () => {
    setSpeedMultiplier(-speedMultiplier);
  };

  const handleDateApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get('simulation-date');
    setSimulationDate(new Date(`${value}T00:00:00Z`));
  };

  const formatDateString = (d: Date) => {
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-4xl glass-panel rounded-xl p-3 border border-white/10 shadow-2xl flex flex-col gap-2.5 pointer-events-auto">
      {/* Top row: Date/Time display & quick buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
        {/* Live Simulation Clock HUD */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-zinc-800 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-white">
              {simulationDate.toUTCString().replace('GMT', 'UTC')}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-zinc-800 font-mono text-[11px] text-zinc-400">
            <span>JD:</span>
            <span className="text-amber-400 font-medium">
              {julianDate.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Date Jump & Historic Events */}
        <div className="flex items-center space-x-2 relative">
          {/* Historical Presets Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsEventsOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg glass-button text-amber-300 border-amber-500/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Historic Events</span>
              <ChevronUp className={`w-3 h-3 transition-transform ${isEventsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isEventsOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-72 glass-panel rounded-lg border border-zinc-700 shadow-2xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1 font-semibold text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                  Jump to Astronomical Milestone
                </div>
                {HISTORIC_EVENTS.map((evt) => (
                  <button
                    key={evt.name}
                    onClick={() => {
                      setSimulationDate(new Date(evt.date));
                      selectBody(evt.focusBodyId);
                      setCameraMode('focus');
                      setIsEventsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-sky-500/20 transition-colors flex flex-col gap-0.5 border-b border-zinc-800/50 last:border-none"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{evt.name}</span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {evt.date.split('T')[0]}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 line-clamp-1">
                      {evt.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Calendar Picker button */}
          <div className="relative">
            <button
              onClick={() => setIsDatePickerOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg glass-button text-zinc-300"
            >
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>Set Date</span>
            </button>

            {isDatePickerOpen && (
              <form noValidate onSubmit={handleDateApply} className="absolute bottom-full right-0 mb-2 p-3 glass-panel rounded-lg border border-zinc-700 shadow-2xl z-50 flex flex-col gap-2">
                <label htmlFor="simulation-date" className="text-[10px] font-mono text-zinc-400 uppercase">
                  Select UTC Date ({SIMULATION_DATE_RANGE_LABEL})
                </label>
                <input
                  type="date"
                  id="simulation-date"
                  name="simulation-date"
                  min={formatDateString(SIMULATION_MIN_DATE)}
                  max={formatDateString(SIMULATION_MAX_DATE)}
                  defaultValue={formatDateString(simulationDate)}
                  className="bg-black/80 border border-zinc-700 text-white rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-sky-500"
                />
                <button type="submit" className="glass-button rounded px-2 py-1 text-xs text-sky-300">Apply UTC Date</button>
              </form>
            )}
          </div>

          {/* Reset to Today */}
          <button
            onClick={resetToNow}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg glass-button text-zinc-300 hover:text-white"
            title="Reset simulation to current real-world time"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Now</span>
          </button>
        </div>
      </div>

      {dateError && <p role="alert" className="text-xs text-amber-300">{dateError}</p>}
      {/* Bottom row: Playback Controls & Speed Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Transport Buttons */}
        <div className="flex items-center space-x-1.5">
          {/* Step Back 30 Days */}
          <button
            onClick={() => stepTime(-30)}
            className="p-1.5 rounded-lg glass-button text-zinc-300"
            title="Step Back 30 Days"
          >
            <Rewind className="w-4 h-4" />
          </button>

          {/* Step Back 1 Day */}
          <button
            onClick={() => stepTime(-1)}
            className="px-2 py-1 text-xs rounded-lg glass-button font-mono text-zinc-300"
            title="Step Back 1 Day"
          >
            -1d
          </button>

          {/* Reverse Direction */}
          <button
            onClick={toggleReverse}
            className={`px-2 py-1 text-xs rounded-lg glass-button font-mono ${
              isReversed ? 'active font-bold' : 'text-zinc-300'
            }`}
            title="Reverse simulation time direction"
          >
            {isReversed ? '◀ REVERSE' : 'FORWARD ▶'}
          </button>

          {/* Primary Play / Pause */}
          <button
            onClick={togglePlay}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-glow-gold'
                : 'bg-sky-500 hover:bg-sky-400 text-black shadow-glow-cyan'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-black" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Resume</span>
              </>
            )}
          </button>

          {/* Step Forward 1 Day */}
          <button
            onClick={() => stepTime(1)}
            className="px-2 py-1 text-xs rounded-lg glass-button font-mono text-zinc-300"
            title="Step Forward 1 Day"
          >
            +1d
          </button>

          {/* Step Forward 30 Days */}
          <button
            onClick={() => stepTime(30)}
            className="p-1.5 rounded-lg glass-button text-zinc-300"
            title="Step Forward 30 Days"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Multiplier Presets */}
        <div className="flex items-center space-x-1 bg-black/50 p-1 rounded-lg border border-zinc-800">
          <span className="text-[10px] font-mono text-zinc-400 px-1.5 uppercase hidden sm:inline">
            Speed:
          </span>
          {SPEED_PRESETS.map((preset) => {
            const isActive = currentSpeedAbs === preset.value;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  const newSpeed = isReversed ? -preset.value : preset.value;
                  setSpeedMultiplier(newSpeed);
                }}
                className={`px-2 py-1 text-xs rounded font-mono transition-all ${
                  isActive
                    ? 'bg-sky-500 text-black font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
