import React, { useEffect, useRef } from 'react';
import { useSimulation } from '../../state/simulationContext';
import { HISTORIC_EVENTS } from '../../astronomy/constants';
import { dateToJulianDate } from '../../astronomy/kepler';
import { SIMULATION_MIN_DATE, SIMULATION_MAX_DATE, SIMULATION_DATE_RANGE_LABEL } from '../../astronomy/modelContract';

const SPEED_PRESETS = [
  { label: 'Real time', value: 1 }, { label: '1 hr/s', value: 3600 },
  { label: '1 day/s', value: 86400 }, { label: '3 days/s', value: 259200 },
  { label: '10 days/s', value: 864000 }, { label: '30 days/s', value: 2592000 },
  { label: '1 year/s', value: 31536000 }, { label: '10 years/s', value: 315360000 },
];
const calendarDate = (date: Date) => date.toISOString().split('T')[0];

export const TimelineControls: React.FC = () => {
  const { simulationDate, setSimulationDate, dateError, isPlaying, togglePlay,
    speedMultiplier, setSpeedMultiplier, stepTime, resetToNow, selectBody, setCameraMode } = useSimulation();
  const timelineRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const element = timelineRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--timeline-height', `${element.getBoundingClientRect().height}px`);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const speed = Math.abs(speedMultiplier);
  const currentSpeed = SPEED_PRESETS.find(preset => preset.value === speed);
  return (
    <div ref={timelineRef} className="timeline-panel glass-panel rounded-xl p-2.5 flex flex-col gap-2" aria-label="Simulation timeline">
      <div className="timeline-main flex flex-wrap items-center justify-between gap-2">
        <time dateTime={simulationDate.toISOString()} className="simulation-time text-xs font-mono text-white">{simulationDate.toUTCString().replace('GMT', 'UTC')}</time>
        <button onClick={togglePlay} className="glass-button rounded px-3 py-1 text-xs text-sky-300">{isPlaying ? 'Pause' : 'Resume'}</button>
        <span className="text-xs text-zinc-300">{speedMultiplier < 0 ? 'Reverse' : 'Forward'} · {currentSpeed?.label ?? `${speed.toLocaleString()}×`}</span>
      </div>
      <details className="timeline-details">
        <summary className="text-xs text-sky-300 cursor-pointer">Time controls</summary>
        <div className="timeline-options flex flex-wrap items-center gap-2 pt-2">
          <div className="flex flex-wrap gap-1" aria-label="Time stepping">
            <button onClick={() => stepTime(-30)} aria-label="Step back 30 days" className="glass-button rounded px-2 py-1 text-xs">−30d</button>
            <button onClick={() => stepTime(-1)} aria-label="Step back one day" className="glass-button rounded px-2 py-1 text-xs">−1d</button>
            <button onClick={() => setSpeedMultiplier(-speedMultiplier)} aria-pressed={speedMultiplier < 0} className="glass-button rounded px-2 py-1 text-xs">Reverse</button>
            <button onClick={() => stepTime(1)} aria-label="Step forward one day" className="glass-button rounded px-2 py-1 text-xs">+1d</button>
            <button onClick={() => stepTime(30)} aria-label="Step forward 30 days" className="glass-button rounded px-2 py-1 text-xs">+30d</button>
          </div>
          <label className="text-xs flex items-center gap-1">Speed
            <select value={speed} onChange={event => setSpeedMultiplier(Number(event.target.value) * (speedMultiplier < 0 ? -1 : 1))} className="bg-black border border-zinc-700 rounded px-2 py-1">
              {!currentSpeed && <option value={speed}>{speed.toLocaleString()}×</option>}
              {SPEED_PRESETS.map(preset => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
            </select>
          </label>
          <button onClick={resetToNow} title="Set the current UTC time and pause; preserve speed and view" className="glass-button rounded px-2 py-1 text-xs">Reset to now</button>
          <span className="text-[11px] font-mono text-zinc-400">JD {dateToJulianDate(simulationDate).toFixed(3)}</span>
          <details className="timeline-disclosure">
            <summary className="text-xs text-amber-300 cursor-pointer">Historic events</summary>
            <div className="timeline-popover glass-panel rounded-lg p-2 space-y-1">
              {HISTORIC_EVENTS.map(event => <button key={event.name} title={event.description} className="block w-full text-left text-xs glass-button rounded p-2" onClick={click => {
                setSimulationDate(new Date(event.date)); selectBody(event.focusBodyId); setCameraMode('focus');
                click.currentTarget.closest('details')?.removeAttribute('open');
              }}>{event.name} · {event.date.split('T')[0]}</button>)}
            </div>
          </details>
          <details className="timeline-disclosure">
            <summary className="text-xs text-sky-300 cursor-pointer" onClick={event => {
              if (!event.currentTarget.parentElement?.hasAttribute('open') && dateInputRef.current) {
                dateInputRef.current.value = calendarDate(simulationDate);
              }
            }}>Set date</summary>
            <form noValidate className="timeline-popover glass-panel rounded-lg p-3 flex flex-col gap-2" onSubmit={event => {
              event.preventDefault();
              const date = new FormData(event.currentTarget).get('simulation-date');
              setSimulationDate(new Date(`${date}T00:00:00Z`));
            }}>
              <label htmlFor="simulation-date" className="text-xs">UTC date ({SIMULATION_DATE_RANGE_LABEL})</label>
              <input ref={dateInputRef} id="simulation-date" name="simulation-date" type="date" min={calendarDate(SIMULATION_MIN_DATE)} max={calendarDate(SIMULATION_MAX_DATE)} defaultValue={calendarDate(simulationDate)} className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs" />
              <button type="submit" className="glass-button rounded px-2 py-1 text-xs">Apply UTC date</button>
              <p className="text-[11px] text-zinc-400">Applying a date pauses playback. Resume when ready.</p>
            </form>
          </details>
        </div>
      </details>
      {dateError && <p role="alert" className="text-xs text-amber-300">{dateError}</p>}
    </div>
  );
};
