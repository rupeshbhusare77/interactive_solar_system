import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Search,
  Layers,
  Ruler,
  HelpCircle,
  Check,
  ChevronDown,
  Globe2,
  Maximize,
  Minimize,
  RotateCcw,
  X,
  Camera,
  Scale,
  SlidersHorizontal,
} from 'lucide-react';
import { useSimulation } from '../../state/simulationContext';
import { CELESTIAL_BODIES } from '../../astronomy/celestialData';
import { ScaleMode, CameraMode } from '../../astronomy/types';

interface HeaderProps {
  onOpenHelp: () => void;
  onToggleMeasurement: () => void;
  isMeasurementOpen: boolean;
}

const SCALE_OPTIONS: { value: ScaleMode; label: string; desc: string }[] = [
  { value: 'educational', label: 'Educational', desc: 'Inner clearance & calibrated sizes' },
  { value: 'hybrid', label: 'Hybrid', desc: 'Logarithmic orbits & balanced sizes' },
  { value: 'real', label: 'Real (1:1)', desc: 'True astronomical dimensions' },
];

const CAMERA_OPTIONS: { value: CameraMode; label: string; desc: string }[] = [
  { value: 'system', label: 'Moon System', desc: 'Frame the selected planet and inner moons' },
  { value: 'free', label: 'Free Orbit', desc: 'Manual orbit, pan & zoom' },
  { value: 'focus', label: 'Focus', desc: 'Smooth flight to target' },
  { value: 'follow', label: 'Lock & Follow', desc: 'Track orbital movement' },
  { value: 'top', label: 'Top View', desc: 'Bird’s-eye heliocentric plane' },
  { value: 'ecliptic', label: 'Ecliptic', desc: 'Edge-on inclination view' },
];

const highlightMatch = (text: string, q: string) => {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.substring(0, idx)}
      <span className="text-sky-300 font-bold underline decoration-sky-400/60">
        {text.substring(idx, idx + q.length)}
      </span>
      {text.substring(idx + q.length)}
    </>
  );
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'star':
      return <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">Star</span>;
    case 'planet':
      return <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">Planet</span>;
    case 'dwarf':
      return <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">Dwarf</span>;
    case 'moon':
      return <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-300 border border-zinc-600/40">Moon</span>;
    case 'comet':
      return <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">Comet</span>;
    default:
      return <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{type}</span>;
  }
};

export const Header: React.FC<HeaderProps> = ({ onOpenHelp, onToggleMeasurement, isMeasurementOpen }) => {
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [isScaleOpen, setIsScaleOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);


  const headerRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const scaleButtonRef = useRef<HTMLButtonElement>(null);
  const scaleMenuRef = useRef<HTMLDivElement>(null);
  const cameraButtonRef = useRef<HTMLButtonElement>(null);
  const cameraMenuRef = useRef<HTMLDivElement>(null);
  const layersButtonRef = useRef<HTMLButtonElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  const searchId = useId();
  const scaleId = useId();
  const cameraId = useId();
  const layersId = useId();
  const mobileId = useId();

  const query = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
  const filteredBodies = query
    ? CELESTIAL_BODIES.filter(
        (body) =>
          body.name.toLowerCase().replace(/[^a-z0-9]/g,'').includes(query.replace(/[^a-z0-9]/g,'')) ||
          body.type.toLowerCase().includes(query)
      ).slice(0, 10)
    : [];

  const chooseBody = (id: string) => {
    selectBody(id);
    setCameraMode('focus');
    setSearchQuery('');
    setActiveIndex(-1);
    setIsSearchOpen(false);
    inputRef.current?.focus();
  };

  const handleResetCamera = () => {
    selectBody(null);
    setCameraMode('free');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateHeight = () =>
      document.documentElement.style.setProperty(
        '--header-height',
        `${header.getBoundingClientRect().height}px`
      );
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target) && !mobileButtonRef.current?.contains(target)) setIsMobileMenuOpen(false);
      if (scaleMenuRef.current && !scaleMenuRef.current.contains(target)) setIsScaleOpen(false);
      if (cameraMenuRef.current && !cameraMenuRef.current.contains(target)) setIsCameraOpen(false);
      if (viewMenuRef.current && !viewMenuRef.current.contains(target)) setIsViewMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  const activeScale = SCALE_OPTIONS.find((s) => s.value === scaleMode) || SCALE_OPTIONS[0];
  const activeCamera = CAMERA_OPTIONS.find((c) => c.value === cameraMode) || CAMERA_OPTIONS[0];

  return (
    <header
      ref={headerRef}
      className="app-header absolute top-0 left-0 right-0 z-40 glass-panel border-b border-white/10 pointer-events-auto"
    >
      {/* Brand */}
      <div className="header-brand flex items-center gap-2.5">
        <div
          aria-hidden="true"
          className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-sky-400 flex items-center justify-center shadow-glow-gold"
        >
          <Globe2 className="w-4 h-4 text-black" />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
            <span>RxSolar</span>
            <span className="text-[10px] text-sky-400 font-mono px-1 py-0.2 rounded bg-sky-500/10 border border-sky-500/20">
              Keplerian 3D
            </span>
          </h1>
          <p className="text-[10px] text-zinc-400 font-mono hidden sm:block">
            Educational planetary dynamics
          </p>
        </div>
      </div>

      {/* Center Controls: Search + Scale Dropdown + Camera Dropdown */}
      <div className="header-controls">
        {/* Search Input */}
        <div
          className="header-search relative"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsSearchOpen(false);
              setActiveIndex(-1);
            }
          }}
        >
          <Search
            aria-hidden="true"
            className="w-4 h-4 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="search"
            aria-label="Search celestial bodies"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isSearchOpen}
            aria-controls={`${searchId}-results`}
            aria-activedescendant={
              isSearchOpen && activeIndex >= 0 && filteredBodies[activeIndex]
                ? `${searchId}-${filteredBodies[activeIndex].id}`
                : undefined
            }
            placeholder="Search planets, moons, comets…"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsSearchOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                setIsSearchOpen(false);
                setActiveIndex(-1);
              }
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                setIsSearchOpen(true);
                if (filteredBodies.length) {
                  setActiveIndex((index) =>
                    event.key === 'ArrowDown'
                      ? (index + 1) % filteredBodies.length
                      : index <= 0
                      ? filteredBodies.length - 1
                      : index - 1
                  );
                }
              }
              if (
                event.key === 'Enter' &&
                isSearchOpen &&
                activeIndex >= 0 &&
                filteredBodies[activeIndex]
              ) {
                event.preventDefault();
                chooseBody(filteredBodies[activeIndex].id);
              }
            }}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-black/60 border border-zinc-700/70 rounded-lg text-white placeholder-zinc-500 font-mono focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
                inputRef.current?.focus();
              }}
              aria-label="Clear search query"
              className="absolute right-2 top-2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Popup */}
          {isSearchOpen && (
            <div className="header-search-popup absolute top-full left-0 right-0 mt-1 py-1 glass-panel rounded-xl border border-zinc-700/80 shadow-2xl z-50 max-h-72 overflow-y-auto">
              <div
                id={`${searchId}-results`}
                role="listbox"
                aria-label="Matching celestial bodies"
              >
                {filteredBodies.map((body, index) => (
                  <button
                    type="button"
                    role="option"
                    id={`${searchId}-${body.id}`}
                    aria-selected={activeIndex === index}
                    key={body.id}
                    onFocus={() => setActiveIndex(index)}
                    onClick={() => chooseBody(body.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        inputRef.current?.focus();
                        setIsSearchOpen(false);
                      }
                      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                        event.preventDefault();
                        const options =
                          event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                            '[role="option"]'
                          );
                        options?.[
                          (index +
                            (event.key === 'ArrowDown' ? 1 : -1) +
                            filteredBodies.length) %
                            filteredBodies.length
                        ]?.focus();
                      }
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      activeIndex === index
                        ? 'bg-sky-500/25 text-white'
                        : 'hover:bg-white/10 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: body.physical.color }}
                      />
                      <span className="font-medium">
                        {highlightMatch(body.name, query)}
                      </span>
                    </div>
                    {getTypeBadge(body.type)}
                  </button>
                ))}
              </div>
              {!filteredBodies.length && (
                <p role="status" className="px-3 py-2 text-xs text-zinc-400">
                  {query
                    ? 'No matching celestial bodies found.'
                    : 'Type a body name or type to search.'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Custom Scale Dropdown */}
        <div
          className="relative hidden md:block"
          ref={scaleMenuRef}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && isScaleOpen) {
              event.preventDefault();
              setIsScaleOpen(false);
              scaleButtonRef.current?.focus();
            }
          }}
        >
          <button
            ref={scaleButtonRef}
            type="button"
            onClick={() => {
              setIsScaleOpen((prev) => !prev);
              setIsCameraOpen(false);
              setIsViewMenuOpen(false);
            }}
            aria-label="Display scale mode"
            aria-expanded={isScaleOpen}
            aria-controls={scaleId}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg glass-button transition-colors ${
              isScaleOpen ? 'active' : 'text-zinc-300'
            }`}
          >
            <Scale aria-hidden="true" className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="hidden sm:inline text-zinc-400">Scale:</span>
            <span className="font-medium text-white">{activeScale.label}</span>
            <ChevronDown
              aria-hidden="true"
              className={`w-3 h-3 text-zinc-400 transition-transform duration-150 ${
                isScaleOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isScaleOpen && (
            <div
              id={scaleId}
              role="listbox"
              aria-label="Display scale options"
              className="absolute left-0 mt-1.5 w-60 glass-panel rounded-xl border border-zinc-700/80 shadow-2xl p-1 z-50 text-xs"
            >
              <div className="px-2.5 py-1 text-[10px] uppercase font-mono text-zinc-400 border-b border-zinc-800">
                Display Scale
              </div>
              {SCALE_OPTIONS.map((opt) => {
                const isCurrent = opt.value === scaleMode;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isCurrent}
                    onClick={() => {
                      setScaleMode(opt.value);
                      setIsScaleOpen(false);
                      scaleButtonRef.current?.focus();
                    }}
                    className={`w-full px-2.5 py-2 text-left rounded-lg flex items-start justify-between transition-colors ${
                      isCurrent ? 'bg-sky-500/20 text-white' : 'hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-white flex items-center gap-1.5">
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-snug">{opt.desc}</div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Camera Dropdown */}
        <div
          className="relative hidden md:block"
          ref={cameraMenuRef}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && isCameraOpen) {
              event.preventDefault();
              setIsCameraOpen(false);
              cameraButtonRef.current?.focus();
            }
          }}
        >
          <button
            ref={cameraButtonRef}
            type="button"
            onClick={() => {
              setIsCameraOpen((prev) => !prev);
              setIsScaleOpen(false);
              setIsViewMenuOpen(false);
            }}
            aria-label="Camera tracking mode"
            aria-expanded={isCameraOpen}
            aria-controls={cameraId}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg glass-button transition-colors ${
              isCameraOpen ? 'active' : 'text-zinc-300'
            }`}
          >
            <Camera aria-hidden="true" className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline text-zinc-400">Camera:</span>
            <span className="font-medium text-white">{activeCamera.label}</span>
            <ChevronDown
              aria-hidden="true"
              className={`w-3 h-3 text-zinc-400 transition-transform duration-150 ${
                isCameraOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isCameraOpen && (
            <div
              id={cameraId}
              role="listbox"
              aria-label="Camera modes"
              className="absolute left-0 mt-1.5 w-56 glass-panel rounded-xl border border-zinc-700/80 shadow-2xl p-1 z-50 text-xs"
            >
              <div className="px-2.5 py-1 text-[10px] uppercase font-mono text-zinc-400 border-b border-zinc-800">
                Camera Mode
              </div>
              {CAMERA_OPTIONS.map((opt) => {
                const isCurrent = opt.value === cameraMode;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isCurrent}
                    onClick={() => {
                      setCameraMode(opt.value);
                      setIsCameraOpen(false);
                      cameraButtonRef.current?.focus();
                    }}
                    className={`w-full px-2.5 py-2 text-left rounded-lg flex items-start justify-between transition-colors ${
                      isCurrent ? 'bg-sky-500/20 text-white' : 'hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-white">{opt.label}</div>
                      <div className="text-[10px] text-zinc-400 leading-snug">{opt.desc}</div>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="header-actions flex items-center gap-1.5">
        {/* Reset Camera / Center Overview */}
        <button
          type="button"
          onClick={handleResetCamera}
          title="Reset camera to free heliocentric overview"
          aria-label="Reset camera to free overview"
          className="p-2 text-xs rounded-lg glass-button text-zinc-300 hover:text-white"
        >
          <RotateCcw aria-hidden="true" className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {/* Measure Tool Toggle */}
        <button
          type="button"
          onClick={onToggleMeasurement}
          aria-label="Measure distance"
          aria-expanded={isMeasurementOpen}
          aria-pressed={isMeasurementOpen}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg glass-button ${
            isMeasurementOpen ? 'active' : 'text-zinc-300'
          }`}
        >
          <Ruler aria-hidden="true" className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Measure</span>
        </button>

        {/* Layers Menu */}
        <div
          className="relative"
          ref={viewMenuRef}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && isViewMenuOpen) {
              event.preventDefault();
              setIsViewMenuOpen(false);
              layersButtonRef.current?.focus();
            }
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsViewMenuOpen(false);
            }
          }}
        >
          <button
            ref={layersButtonRef}
            type="button"
            onClick={() => {
              setIsViewMenuOpen((open) => !open);
              setIsScaleOpen(false);
              setIsCameraOpen(false);
            }}
            aria-label="Visual layers"
            aria-expanded={isViewMenuOpen}
            aria-controls={layersId}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg glass-button text-zinc-300"
          >
            <Layers aria-hidden="true" className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Layers</span>
            <ChevronDown aria-hidden="true" className="w-3 h-3 text-zinc-400" />
          </button>

          {isViewMenuOpen && (
            <div
              id={layersId}
              role="group"
              aria-label="Visual layers"
              className="header-layers-popup absolute right-0 mt-1.5 w-56 glass-panel rounded-xl border border-zinc-700/80 shadow-2xl py-1.5 z-50 text-xs"
            >
              <div className="px-3 py-1 text-[10px] uppercase font-mono text-zinc-400 border-b border-zinc-800">
                Scene Overlays
              </div>
              {[
                { key: 'showOrbits', label: 'Orbit paths' },
                { key: 'showLabels', label: 'Celestial labels' },
                { key: 'showHabitableZone', label: 'Habitable zone' },
                { key: 'showAsteroidBelt', label: 'Asteroid belt' },
                { key: 'showKuiperBelt', label: 'Kuiper belt' },
                { key: 'showMoons', label: 'Moons' },
                { key: 'showLighting', label: 'Sun day/night lighting' },
                { key: 'showDistanceGrid', label: 'Ecliptic grid' },
              ].map(({ key, label }) => {
                const active = viewToggles[key as keyof typeof viewToggles];
                return (
                  <button
                    type="button"
                    key={key}
                    aria-pressed={active}
                    onClick={() => toggleView(key as keyof typeof viewToggles)}
                    className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-white/10 transition-colors"
                  >
                    <span className={active ? 'text-white' : 'text-zinc-400'}>
                      {label}
                    </span>
                    {active && (
                      <Check aria-hidden="true" className="w-4 h-4 text-sky-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="p-2 text-xs text-zinc-300 glass-button rounded-lg hover:text-white"
        >
          {isFullscreen ? (
            <Minimize aria-hidden="true" className="w-3.5 h-3.5 text-sky-400" />
          ) : (
            <Maximize aria-hidden="true" className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </button>

        {/* Help Modal Trigger */}
        <button
          type="button"
          onClick={onOpenHelp}
          aria-label="Open astronomical guide and controls"
          aria-haspopup="dialog"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-300 glass-button rounded-lg hover:text-white"
        >
          <HelpCircle aria-hidden="true" className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Help</span>
        </button>

        {/* Mobile Settings Menu Toggle */}
        <button
          type="button"
          ref={mobileButtonRef}
          aria-controls={mobileId}
          onClick={() => {
            setIsMobileMenuOpen((prev) => !prev);
            setIsViewMenuOpen(false);
            setIsSearchOpen(false);
          }}
          aria-label={isMobileMenuOpen ? 'Close settings menu' : 'Open settings menu'}
          aria-expanded={isMobileMenuOpen}
          className={`md:hidden p-2 text-xs rounded-lg glass-button transition-colors ${
            isMobileMenuOpen ? 'active text-sky-300' : 'text-zinc-300 hover:text-white'
          }`}
        >
          {isMobileMenuOpen ? (
            <X aria-hidden="true" className="w-3.5 h-3.5 text-sky-400" />
          ) : (
            <SlidersHorizontal aria-hidden="true" className="w-3.5 h-3.5 text-sky-400" />
          )}
        </button>
      </div>

      {/* Mobile Settings & View Drawer */}
      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} id={mobileId} role="region" aria-label="Display settings"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsMobileMenuOpen(false);
              mobileButtonRef.current?.focus();
            }
          }}
          className="mobile-settings md:hidden p-3 glass-panel rounded-2xl border border-zinc-700/80 shadow-2xl flex flex-col gap-3 text-xs z-50">
          {/* Scale selection */}
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Scale className="w-3 h-3 text-sky-400" /> Display Scale
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {SCALE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setScaleMode(opt.value);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-center font-medium transition-colors ${
                    scaleMode === opt.value
                      ? 'bg-sky-500/25 text-white border border-sky-400/60 font-semibold'
                      : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/50'
                  }`}
                >
                  <div className="truncate">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Camera selection */}
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Camera className="w-3 h-3 text-sky-400" /> Camera Angle
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {CAMERA_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setCameraMode(opt.value);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-center font-medium transition-colors ${
                    cameraMode === opt.value
                      ? 'bg-sky-500/25 text-white border border-sky-400/60 font-semibold'
                      : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/50'
                  }`}
                >
                  <div className="truncate">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scene Layer Quick Toggles */}
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-amber-400" /> Scene Overlays
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'showOrbits', label: 'Orbit paths' },
                { key: 'showLabels', label: 'Labels' },
                { key: 'showHabitableZone', label: 'Habitable zone' },
                { key: 'showAsteroidBelt', label: 'Asteroid belt' },
                { key: 'showKuiperBelt', label: 'Kuiper belt' },
                { key: 'showMoons', label: 'Moons' },
              ].map(({ key, label }) => {
                const active = viewToggles[key as keyof typeof viewToggles];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleView(key as keyof typeof viewToggles)}
                    className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-colors ${
                      active
                        ? 'bg-sky-500/20 text-white border border-sky-400/40'
                        : 'bg-zinc-800/50 text-zinc-400'
                    }`}
                  >
                    <span>{label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
