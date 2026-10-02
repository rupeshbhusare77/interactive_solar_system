/**
 * 3D Solar System Simulator — Top Navigation Header
 * Features search with autocompletion, scale mode selector, camera mode selector, and view toggles.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Camera,
  Layers,
  Sliders,
  Ruler,
  HelpCircle,
  Eye,
  Check,
  ChevronDown,
  Globe2,
} from 'lucide-react';
import { useSimulation } from '../../state/simulationContext';
import { CELESTIAL_BODIES } from '../../astronomy/celestialData';
import { ScaleMode, CameraMode } from '../../astronomy/types';

interface HeaderProps {
  onOpenHelp: () => void;
  onToggleMeasurement: () => void;
  isMeasurementOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHelp,
  onToggleMeasurement,
  isMeasurementOpen,
}) => {
  const {
    scaleMode,
    setScaleMode,
    cameraMode,
    setCameraMode,
    selectBody,
    viewToggles,
    toggleView,
  } = useSimulation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  // Filter bodies for search autocompletion
  const filteredBodies = searchQuery.trim()
    ? CELESTIAL_BODIES.filter((b) =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.type.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setIsViewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2.5 glass-panel border-b border-white/10 pointer-events-auto">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-sky-400 flex items-center justify-center shadow-glow-gold">
          <Globe2 className="w-5 h-5 text-black" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
            RxSolar <span className="text-[10px] px-1.5 py-0.2 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded font-mono">Keplerian 3D</span>
          </h1>
          <p className="text-[10px] text-zinc-400 font-mono tracking-tight hidden sm:block">
            High-Precision Astronomical Physics Engine
          </p>
        </div>
      </div>

      {/* Center: Search & Navigation */}
      <div className="flex items-center space-x-3">
        {/* Search Bar */}
        <div className="relative w-48 sm:w-64">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search planet, moon, comet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/60 border border-zinc-700/60 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-mono"
            />
          </div>

          {/* Autocompletion Popup */}
          {isSearchFocused && filteredBodies.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 py-1 glass-panel rounded-lg border border-zinc-700/80 shadow-2xl z-50 max-h-64 overflow-y-auto">
              {filteredBodies.map((body) => (
                <button
                  key={body.id}
                  onClick={() => {
                    selectBody(body.id);
                    setCameraMode('focus');
                    setSearchQuery('');
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-sky-500/20 hover:text-sky-300 flex items-center justify-between transition-colors"
                >
                  <span className="font-medium text-white">{body.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {body.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scale Mode Selector */}
        <div className="hidden md:flex items-center space-x-1 bg-black/50 p-1 rounded-lg border border-zinc-800">
          <span className="text-[10px] font-mono text-zinc-400 px-1.5 uppercase">Scale:</span>
          {[
            { id: 'educational' as ScaleMode, label: 'Educational', title: 'Educational: Balanced orbit spacing with true size hierarchy (Ganymede/Titan > Mercury)' },
            { id: 'hybrid' as ScaleMode, label: 'Hybrid', title: 'Hybrid: Natural logarithmic orbit distances with consistent proportional bodies' },
            { id: 'real' as ScaleMode, label: 'Real (1:1)', title: 'Real 1:1: Mathematically exact 1:1 physical radii and true astronomical AU distances' },
          ].map(({ id, label, title }) => (
            <button
              key={id}
              onClick={() => setScaleMode(id)}
              title={title}
              className={`px-2 py-1 text-xs rounded capitalize transition-all ${
                scaleMode === id
                  ? 'bg-sky-500 text-black font-semibold shadow-sm'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Camera Mode Selector */}
        <div className="hidden lg:flex items-center space-x-1 bg-black/50 p-1 rounded-lg border border-zinc-800">
          <Camera className="w-3.5 h-3.5 text-zinc-400 ml-1" />
          {(['free', 'focus', 'follow', 'top', 'ecliptic'] as CameraMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setCameraMode(mode)}
              className={`px-2 py-1 text-xs rounded capitalize transition-all ${
                cameraMode === mode
                  ? 'bg-indigo-500 text-white font-semibold'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Right Controls: Layers, Measurement, Help */}
      <div className="flex items-center space-x-2">
        {/* Distance Measurement Tool Button */}
        <button
          onClick={onToggleMeasurement}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg glass-button ${
            isMeasurementOpen ? 'active' : 'text-zinc-300'
          }`}
          title="Measure distance between celestial bodies"
        >
          <Ruler className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Measure</span>
        </button>

        {/* View Layers Dropdown */}
        <div className="relative" ref={viewMenuRef}>
          <button
            onClick={() => setIsViewMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg glass-button text-zinc-300"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Layers</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {isViewMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 glass-panel rounded-lg border border-zinc-700/80 shadow-2xl py-1.5 z-50 text-xs">
              <div className="px-3 py-1 font-semibold text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                Visual Layers
              </div>

              {[
                { key: 'showOrbits', label: 'Orbit Paths' },
                { key: 'showLabels', label: 'Labels & Billboards' },
                { key: 'showHabitableZone', label: 'Habitable Zone' },
                { key: 'showAsteroidBelt', label: 'Asteroid Belt' },
                { key: 'showKuiperBelt', label: 'Kuiper Belt' },
                { key: 'showMoons', label: 'Moons' },
                { key: 'showLighting', label: 'Realistic Sun Day/Night' },
                { key: 'showDistanceGrid', label: 'Ecliptic Grid' },
              ].map(({ key, label }) => {
                const active = viewToggles[key as keyof typeof viewToggles];
                return (
                  <button
                    key={key}
                    onClick={() => toggleView(key as keyof typeof viewToggles)}
                    className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <span className={active ? 'text-white' : 'text-zinc-400'}>{label}</span>
                    {active ? (
                      <Check className="w-3.5 h-3.5 text-sky-400" />
                    ) : (
                      <span className="w-3.5 h-3.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Guide Modal Trigger */}
        <button
          onClick={onOpenHelp}
          className="p-1.5 text-zinc-300 hover:text-white glass-button rounded-lg"
          title="Astronomical Guide & Controls"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
