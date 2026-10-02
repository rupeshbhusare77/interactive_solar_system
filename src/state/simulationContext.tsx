/**
 * 3D Solar System Simulator — Global Simulation State & Context
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ScaleMode, CameraMode, ViewToggles } from '../astronomy/types';

export interface SimulationContextType {
  // Time and animation
  simulationDate: Date;
  setSimulationDate: (date: Date) => void;
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
  const [simulationDate, setSimulationDate] = useState<Date>(() => new Date());
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  // Default speed: 1 day per real second (86400 sim seconds / real second)
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(86400 * 3);
  const [scaleMode, setScaleMode] = useState<ScaleMode>('educational');
  const [cameraMode, setCameraMode] = useState<CameraMode>('free');

  const [selectedBodyId, setSelectedBodyId] = useState<string | null>('earth');
  const [hoveredBodyId, setHoveredBodyId] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(true);

  const [measurementOriginId, setMeasurementOriginId] = useState<string | null>('sun');
  const [measurementTargetId, setMeasurementTargetId] = useState<string | null>('earth');

  const [viewToggles, setViewToggles] = useState<ViewToggles>(defaultToggles);

  // High precision simulation animation loop
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying && deltaSec > 0 && deltaSec < 1.0) {
        setSimulationDate((prevDate) => {
          const simDeltaMs = deltaSec * speedMultiplier * 1000;
          return new Date(prevDate.getTime() + simDeltaMs);
        });
      }

      animId = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speedMultiplier]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const stepTime = useCallback((days: number) => {
    setSimulationDate((prev) => new Date(prev.getTime() + days * 86400 * 1000));
  }, []);

  const resetToNow = useCallback(() => {
    setSimulationDate(new Date());
  }, []);

  const selectBody = useCallback((id: string | null) => {
    setSelectedBodyId(id);
    if (id) {
      setIsInfoOpen(true);
    }
  }, []);

  const toggleView = useCallback((key: keyof ViewToggles) => {
    setViewToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        simulationDate,
        setSimulationDate,
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
