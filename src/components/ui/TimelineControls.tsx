import React, { useState, useEffect, useRef, useId } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Calendar,
  FastForward,
  Rewind,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Sliders,
  X,
  Check,
} from 'lucide-react';
import { useSimulation } from '../../state/simulationContext';
import { HISTORIC_EVENTS } from '../../astronomy/constants';
import { dateToJulianDate } from '../../astronomy/kepler';
import {
  SIMULATION_MIN_DATE,
  SIMULATION_MAX_DATE,
  SIMULATION_DATE_RANGE_LABEL,
} from '../../astronomy/modelContract';

const SPEED_PRESETS = [
  { label: 'Real time (1×)', value: 1 },
  { label: '1 hour / sec', value: 3600 },
  { label: '1 day / sec', value: 86400 },
  { label: '3 days / sec', value: 259200 },
  { label: '10 days / sec', value: 864000 },
  { label: '30 days / sec', value: 2592000 },
  { label: '1 year / sec', value: 31536000 },
  { label: '10 years / sec', value: 315360000 },
];

const calendarDate = (date: Date) => date.toISOString().split('T')[0];

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

  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const eventsMenuRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);

  const speedMenuId = useId();
  const eventsMenuId = useId();
  const dateMenuId = useId();

  useEffect(() => {
    const element = timelineRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty(
        '--timeline-height',
        `${element.getBoundingClientRect().height}px`
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (speedMenuRef.current && !speedMenuRef.current.contains(target)) setIsSpeedOpen(false);
      if (eventsMenuRef.current && !eventsMenuRef.current.contains(target)) setIsEventsOpen(false);
      if (dateMenuRef.current && !dateMenuRef.current.contains(target)) setIsDateOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  const speed = Math.abs(speedMultiplier);
  const currentSpeed = SPEED_PRESETS.find((preset) => preset.value === speed);

  const minTime = SIMULATION_MIN_DATE.getTime();
  const maxTime = SIMULATION_MAX_DATE.getTime();
  const currentTime = Math.min(Math.max(simulationDate.getTime(), minTime), maxTime);

  return (
    <div
      ref={timelineRef}
      className="timeline-panel glass-panel rounded-xl p-3 flex flex-col gap-2 pointer-events-auto border border-white/10 shadow-2xl backdrop-blur-xl"
      aria-label="Simulation timeline"
    >
      {/* Primary Top Row: Live Clock, Transport Controls, Speed & Popovers */}
      <div className="timeline-main flex flex-wrap items-center justify-between gap-2.5">
        {/* Live Monospace Clock */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
              isPlaying ? 'bg-emerald-400 shadow-glow-cyan' : 'bg-amber-400'
            }`}
            title={isPlaying ? 'Simulation Running' : 'Simulation Paused'}
          />
          <time
            dateTime={simulationDate.toISOString()}
            className="simulation-time text-xs font-mono font-bold text-white tracking-wider tabular-nums"
          >
            {simulationDate.toUTCString().replace('GMT', 'UTC')}
          </time>
          <span className="text-[10px] font-mono text-zinc-400 hidden md:inline">
            JD {dateToJulianDate(simulationDate).toFixed(2)}
          </span>
        </div>

        {/* Transport Stepping & Playback Buttons */}
        <div className="flex items-center gap-1" aria-label="Playback controls">
          {/* Step -30 Days */}
          <button
            onClick={() => stepTime(-30)}
            aria-label="Step back 30 days"
            title="Step back 30 days"
            className="glass-button p-1.5 rounded-lg text-zinc-300 hover:text-white"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Step -1 Day */}
          <button
            onClick={() => stepTime(-1)}
            aria-label="Step back one day"
            title="Step back one day"
            className="glass-button p-1.5 rounded-lg text-zinc-300 hover:text-white"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause Toggle Button */}
          <button
            onClick={togglePlay}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              isPlaying
                ? 'bg-sky-500/25 border border-sky-400 text-sky-300 shadow-glow-cyan'
                : 'glass-button text-amber-300 border-amber-400/40'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </>
            )}
          </button>

          {/* Step +1 Day */}
          <button
            onClick={() => stepTime(1)}
            aria-label="Step forward one day"
            title="Step forward one day"
            className="glass-button p-1.5 rounded-lg text-zinc-300 hover:text-white"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Step +30 Days */}
          <button
            onClick={() => stepTime(30)}
            aria-label="Step forward 30 days"
            title="Step forward 30 days"
            className="glass-button p-1.5 rounded-lg text-zinc-300 hover:text-white"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Reverse Direction */}
          <button
            onClick={() => setSpeedMultiplier(-speedMultiplier)}
            aria-pressed={speedMultiplier < 0}
            title={speedMultiplier < 0 ? 'Reverse motion active' : 'Reverse motion'}
            className={`p-1.5 rounded-lg transition-colors ${
              speedMultiplier < 0
                ? 'bg-amber-500/25 border border-amber-400/80 text-amber-300'
                : 'glass-button text-zinc-400 hover:text-white'
            }`}
          >
            {speedMultiplier < 0 ? (
              <Rewind className="w-3.5 h-3.5" />
            ) : (
              <FastForward className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Secondary Actions: Speed Popover, Events, Set Date, Reset to Now */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Speed Preset Popover */}
          <div className="relative" ref={speedMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsSpeedOpen((prev) => !prev);
                setIsEventsOpen(false);
                setIsDateOpen(false);
              }}
              aria-label="Simulation speed"
              aria-expanded={isSpeedOpen}
              aria-controls={speedMenuId}
              className={`glass-button px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 text-zinc-300 hover:text-white ${
                isSpeedOpen ? 'active' : ''
              }`}
            >
              <Sliders className="w-3 h-3 text-sky-400" />
              <span className="font-mono">{currentSpeed?.label.split(' ')[0] ?? `${speed.toLocaleString()}×`}</span>
            </button>

            {isSpeedOpen && (
              <div
                id={speedMenuId}
                className="timeline-popover glass-panel rounded-xl p-1.5 space-y-1 z-50 text-xs border border-zinc-700 shadow-2xl"
              >
                <div className="px-2.5 py-1 text-[10px] uppercase font-mono text-zinc-400 border-b border-zinc-800">
                  Simulation Speed
                </div>
                {SPEED_PRESETS.map((preset) => {
                  const isCurrent = preset.value === speed;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setSpeedMultiplier(preset.value * (speedMultiplier < 0 ? -1 : 1));
                        setIsSpeedOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 text-left rounded-lg flex items-center justify-between transition-colors ${
                        isCurrent ? 'bg-sky-500/20 text-white font-medium' : 'hover:bg-white/10 text-zinc-300'
                      }`}
                    >
                      <span>{preset.label}</span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historic Events Popover */}
          <div className="relative" ref={eventsMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsEventsOpen((prev) => !prev);
                setIsSpeedOpen(false);
                setIsDateOpen(false);
              }}
              aria-label="Historic astronomical events"
              aria-expanded={isEventsOpen}
              aria-controls={eventsMenuId}
              className={`glass-button px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 text-amber-300 hover:text-white ${
                isEventsOpen ? 'active' : ''
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Events</span>
            </button>

            {isEventsOpen && (
              <div
                id={eventsMenuId}
                className="timeline-popover glass-panel rounded-xl p-2 space-y-1.5 z-50 text-xs border border-zinc-700 shadow-2xl max-w-sm"
              >
                <div className="px-2 py-1 text-[10px] uppercase font-mono text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
                  <span>Historic Mission Milestones</span>
                  <span className="text-zinc-500">Pauses simulation</span>
                </div>
                {HISTORIC_EVENTS.map((event) => (
                  <button
                    key={event.name}
                    title={event.description}
                    onClick={() => {
                      setSimulationDate(new Date(event.date));
                      selectBody(event.focusBodyId);
                      setCameraMode('focus');
                      setIsEventsOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-lg glass-button hover:bg-white/10 transition-colors flex flex-col gap-0.5"
                  >
                    <div className="font-semibold text-white flex items-center justify-between">
                      <span>{event.name}</span>
                      <span className="text-[10px] text-sky-400 font-mono">
                        {event.date.split('T')[0]}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 line-clamp-2">
                      {event.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Set Date Popover */}
          <div className="relative" ref={dateMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsDateOpen((prev) => !prev);
                setIsSpeedOpen(false);
                setIsEventsOpen(false);
                if (!isDateOpen && dateInputRef.current) {
                  dateInputRef.current.value = calendarDate(simulationDate);
                }
              }}
              aria-label="Set simulation date"
              aria-expanded={isDateOpen}
              aria-controls={dateMenuId}
              className={`glass-button px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 text-sky-300 hover:text-white ${
                isDateOpen ? 'active' : ''
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Date</span>
            </button>

            {isDateOpen && (
              <form
                id={dateMenuId}
                noValidate
                className="timeline-popover glass-panel rounded-xl p-3 flex flex-col gap-2.5 z-50 text-xs border border-zinc-700 shadow-2xl"
                onSubmit={(event) => {
                  event.preventDefault();
                  const date = new FormData(event.currentTarget).get('simulation-date');
                  if (date) {
                    setSimulationDate(new Date(`${date}T00:00:00Z`));
                    setIsDateOpen(false);
                  }
                }}
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                  <label htmlFor="simulation-date" className="font-semibold text-white">
                    Jump to UTC Date
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {SIMULATION_DATE_RANGE_LABEL}
                  </span>
                </div>
                <input
                  ref={dateInputRef}
                  id="simulation-date"
                  name="simulation-date"
                  type="date"
                  min={calendarDate(SIMULATION_MIN_DATE)}
                  max={calendarDate(SIMULATION_MAX_DATE)}
                  defaultValue={calendarDate(simulationDate)}
                  className="bg-black/70 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-sky-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="glass-button bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-lg py-1.5 text-xs font-semibold"
                >
                  Apply UTC Date
                </button>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Applying a date pauses playback. Resume when ready.
                </p>
              </form>
            )}
          </div>

          {/* Reset to Now */}
          <button
            onClick={resetToNow}
            title="Set current UTC time and pause (preserves speed and view)"
            aria-label="Reset date to now"
            className="glass-button px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 text-zinc-300 hover:text-white"
          >
            <RotateCcw className="w-3 h-3 text-zinc-400" />
            <span className="hidden sm:inline">Now</span>
          </button>
        </div>
      </div>

      {/* Interactive Time Scrubber Slider */}
      <div className="w-full flex flex-col gap-1 pt-1.5 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 px-1">
          <span>1800</span>
          <span className="hidden sm:inline">1850</span>
          <span>1900</span>
          <span className="hidden sm:inline">1950</span>
          <span className="text-sky-400 font-bold">2000 (J2000)</span>
          <span className="hidden sm:inline">2050</span>
          <span>2100</span>
        </div>
        <input
          type="range"
          min={minTime}
          max={maxTime}
          step={86400000}
          value={currentTime}
          onChange={(event) => {
            setSimulationDate(new Date(Number(event.target.value)));
          }}
          aria-label="Simulation date timeline scrubber"
          className="w-full h-1.5 bg-zinc-800/90 rounded-lg appearance-none cursor-pointer accent-sky-400 hover:accent-sky-300 focus:outline-none"
        />
      </div>

      {/* Error Notice */}
      {dateError && (
        <p role="alert" className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1">
          {dateError}
        </p>
      )}
    </div>
  );
};
