/**
 * 3D Solar System Simulator — Global Simulation State & Context
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ScaleMode, CameraMode, ViewToggles } from '../astronomy/types';
import { clampSimulationDate, validateSimulationDate, SIMULATION_MIN_DATE, SIMULATION_MAX_DATE } from '../astronomy/modelContract';
import { createFrameCalculations } from './frameCalculations';

export interface SimulationContextType {
  // Time and animation
  simulationDate: Date;
  getSimulationDate: () => Date;
  getBodyPosition: ReturnType<typeof createFrameCalculations>['getBodyPosition'];
  getBodyEphemeris: ReturnType<typeof createFrameCalculations>['getBodyEphemeris'];
  setSimulationDate: (date: Date) => void;
  dateError: string | null;
  isPlaying: boolean;
  togglePlay: () => void;
  speedMultiplier: number;
  setSpeedMultiplier: (speed: number) => void;
  stepTime: (days: number) => void;
  resetToNow: () => void;

  // Scale and camera modes
  scaleMode: ScaleMode;
  setScaleMode: (mode: ScaleMode) => void;
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;

  // Body selection & navigation
  selectedBodyId: string | null;
  selectBody: (id: string | null) => void;
  hoveredBodyId: string | null;
  setHoveredBodyId: (id: string | null) => void;

  // Measurement tool
  isMeasurementOpen: boolean;
  setIsMeasurementOpen: (open: boolean) => void;
  measurementOriginId: string | null;
  setMeasurementOriginId: (id: string | null) => void;
  measurementTargetId: string | null;
  setMeasurementTargetId: (id: string | null) => void;

  // Visual toggles
  viewToggles: ViewToggles;
  toggleView: (key: keyof ViewToggles) => void;

  // Info drawer visibility
  isInfoOpen: boolean;
  setIsInfoOpen: (open: boolean) => void;
}

const defaultToggles: ViewToggles = {
  showOrbits: true,
  showLabels: true,
  showHabitableZone: false,
  showAsteroidBelt: false,
  showKuiperBelt: false,
  showMoons: true,
  showLighting: true,
  showDistanceGrid: false,
};

const SimulationContext = createContext<SimulationContextType | null>(null);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [simulationDate, updateSimulationDate] = useState<Date>(() => clampSimulationDate(new Date()));
  const dateRef = useRef(simulationDate);
  const getSimulationDate = useCallback(() => dateRef.current, []);
  const calculations = useRef<ReturnType<typeof createFrameCalculations>>();
  if (!calculations.current) calculations.current = createFrameCalculations(getSimulationDate);
  const [dateError, setDateError] = useState<string | null>(null);
  const setSimulationDate = useCallback((date: Date) => {
    const error = validateSimulationDate(date);
    setDateError(error);
    if (!error) {
      dateRef.current = new Date(date.getTime());
      updateSimulationDate(dateRef.current);
      setIsPlaying(false);
    }
  }, []);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  // Default speed: three simulation days per real second.
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(86400 * 3);
  const [scaleMode, setScaleMode] = useState<ScaleMode>('educational');
  const [cameraMode, setCameraMode] = useState<CameraMode>('free');

  const [selectedBodyId, setSelectedBodyId] = useState<string | null>('earth');
  const [hoveredBodyId, setHoveredBodyId] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(true);

  const [measurementOriginId, setMeasurementOriginId] = useState<string | null>('sun');
  const [isMeasurementOpen, updateIsMeasurementOpen] = useState(false);
  const setIsMeasurementOpen = useCallback((open: boolean) => {
    updateIsMeasurementOpen(open);
    if (open) setIsInfoOpen(false);
  }, []);
  const [measurementTargetId, setMeasurementTargetId] = useState<string | null>('earth');

  const [viewToggles, setViewToggles] = useState<ViewToggles>(defaultToggles);

  // Renderers read the imperative clock; React telemetry is published at most 10 Hz.
  useEffect(() => {
    if (!isPlaying) return;
    let animId = 0;
    let lastTime = performance.now();
    let lastPublication = lastTime;
    const tick = (now: number) => {
      const deltaMs = now - lastTime;
      lastTime = now;
      // Hidden time and foreground stalls of one second or longer are dropped, never replayed.
      if (!document.hidden && deltaMs > 0 && deltaMs < 1000 && speedMultiplier !== 0) {
        const next = dateRef.current.getTime() + deltaMs * speedMultiplier;
        dateRef.current = clampSimulationDate(new Date(next));
        const atBoundary = (speedMultiplier > 0 && next >= SIMULATION_MAX_DATE.getTime()) ||
          (speedMultiplier < 0 && next <= SIMULATION_MIN_DATE.getTime());
        if (atBoundary) {
          updateSimulationDate(dateRef.current);
          setIsPlaying(false);
          setDateError('Playback paused at the 1800–2100 UTC navigation limit. Reverse direction or choose another date.');
          return;
        }
        if (now - lastPublication >= 100) {
          updateSimulationDate(dateRef.current);
          lastPublication = now;
        }
      }
      animId = requestAnimationFrame(tick);
    };
    const resetElapsed = () => { lastTime = performance.now(); };
    document.addEventListener('visibilitychange', resetElapsed);
    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', resetElapsed);
    };
  }, [isPlaying, speedMultiplier]);

  useEffect(() => {
    const timestamp = simulationDate.getTime();
    if (isPlaying && ((speedMultiplier > 0 && timestamp >= SIMULATION_MAX_DATE.getTime()) ||
      (speedMultiplier < 0 && timestamp <= SIMULATION_MIN_DATE.getTime()))) {
      setIsPlaying(false);
      setDateError('Playback paused at the 1800–2100 UTC navigation limit. Reverse direction or choose another date.');
    }
  }, [simulationDate, isPlaying, speedMultiplier]);

  const togglePlay = useCallback(() => {
    updateSimulationDate(dateRef.current);
    setIsPlaying((prev) => !prev);
  }, []);

  const stepTime = useCallback((days: number) => {
    if (!Number.isFinite(days)) {
      setDateError('Enter a finite number of days.');
      return;
    }
    setDateError(null);
    dateRef.current = clampSimulationDate(new Date(dateRef.current.getTime() + days * 86400 * 1000));
    updateSimulationDate(dateRef.current);
    setIsPlaying(false);
  }, []);

  const resetToNow = useCallback(() => {
    setSimulationDate(new Date());
  }, [setSimulationDate]);

  const selectBody = useCallback((id: string | null) => {
    setSelectedBodyId(id);
    if (id) {
      setIsInfoOpen(true);
      updateIsMeasurementOpen(false);
    }
  }, []);

  const toggleView = useCallback((key: keyof ViewToggles) => {
    setViewToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        simulationDate,
        getSimulationDate,
        getBodyPosition: calculations.current.getBodyPosition,
        getBodyEphemeris: calculations.current.getBodyEphemeris,
        setSimulationDate,
        dateError,
        isPlaying,
        togglePlay,
        speedMultiplier,
        setSpeedMultiplier,
        stepTime,
        resetToNow,
        scaleMode,
        setScaleMode,
        cameraMode,
        setCameraMode,
        selectedBodyId,
        selectBody,
        hoveredBodyId,
        setHoveredBodyId,
        measurementOriginId,
        isMeasurementOpen,
        setIsMeasurementOpen,
        setMeasurementOriginId,
        measurementTargetId,
        setMeasurementTargetId,
        viewToggles,
        toggleView,
        isInfoOpen,
        setIsInfoOpen,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
