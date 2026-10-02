import React, { useState, useRef, useEffect, useId } from 'react';
import { Search, Layers, Ruler, HelpCircle, Check, ChevronDown, Globe2 } from 'lucide-react';
import { useSimulation } from '../../state/simulationContext';
import { CELESTIAL_BODIES } from '../../astronomy/celestialData';
import { ScaleMode, CameraMode } from '../../astronomy/types';

interface HeaderProps {
  onOpenHelp: () => void;
  onToggleMeasurement: () => void;
  isMeasurementOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHelp, onToggleMeasurement, isMeasurementOpen }) => {
  const { scaleMode, setScaleMode, cameraMode, setCameraMode, selectBody, viewToggles, toggleView } = useSimulation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const layersButtonRef = useRef<HTMLButtonElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const searchId = useId();
  const layersId = useId();
  const query = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
  const filteredBodies = query ? CELESTIAL_BODIES.filter((body) =>
    body.name.toLowerCase().includes(query) || body.type.toLowerCase().includes(query)
  ).slice(0, 8) : [];
  const chooseBody = (id: string) => {
    selectBody(id);
    setCameraMode('focus');
    setSearchQuery('');
    setActiveIndex(-1);
    setIsSearchOpen(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateHeight = () => document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!viewMenuRef.current?.contains(event.target as Node)) setIsViewMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  return (
    <header ref={headerRef} className="app-header absolute top-0 left-0 right-0 z-20 glass-panel border-b border-white/10 pointer-events-auto">
      <div className="header-brand flex items-center gap-3">
        <div aria-hidden="true" className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-sky-400 flex items-center justify-center shadow-glow-gold">
          <Globe2 className="w-5 h-5 text-black" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider text-white uppercase">RxSolar <span className="text-[10px] text-sky-400 font-mono">Keplerian 3D</span></h1>
          <p className="text-[10px] text-zinc-400 font-mono">Educational orbit model</p>
        </div>
      </div>
      <div className="header-controls">
        <div className="header-search relative" onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsSearchOpen(false);
            setActiveIndex(-1);
          }
        }}>
          <Search aria-hidden="true" className="w-4 h-4 text-zinc-400 absolute left-2.5 top-3 pointer-events-none" />
          <input
            ref={inputRef} type="search" aria-label="Search celestial bodies" role="combobox"
            aria-autocomplete="list" aria-expanded={isSearchOpen} aria-controls={`${searchId}-results`}
            aria-activedescendant={isSearchOpen && activeIndex >= 0 && filteredBodies[activeIndex] ? `${searchId}-${filteredBodies[activeIndex].id}` : undefined}
            placeholder="Search planet, moon, comet…" value={searchQuery}
            onChange={(event) => { setSearchQuery(event.target.value); setIsSearchOpen(true); setActiveIndex(-1); }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') { event.preventDefault(); setIsSearchOpen(false); setActiveIndex(-1); }
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault(); setIsSearchOpen(true);
                if (filteredBodies.length) setActiveIndex((index) => event.key === 'ArrowDown'
                  ? (index + 1) % filteredBodies.length
                  : (index <= 0 ? filteredBodies.length - 1 : index - 1));
              }
              if (event.key === 'Enter' && isSearchOpen && activeIndex >= 0 && filteredBodies[activeIndex]) {
                event.preventDefault(); chooseBody(filteredBodies[activeIndex].id);
              }
            }}
            className="w-full pl-8 pr-3 py-2 text-xs bg-black/60 border border-zinc-700/60 rounded-lg text-white placeholder-zinc-500 font-mono"
          />
          {isSearchOpen && (
            <div className="header-search-popup absolute top-full left-0 right-0 mt-1 py-1 glass-panel rounded-lg border border-zinc-700/80 shadow-2xl z-50 max-h-64 overflow-y-auto">
              <div id={`${searchId}-results`} role="listbox" aria-label="Matching celestial bodies">
                {filteredBodies.map((body, index) => (
                  <button type="button" role="option" id={`${searchId}-${body.id}`} aria-selected={activeIndex === index} key={body.id}
                    onFocus={() => setActiveIndex(index)} onClick={() => chooseBody(body.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') { event.preventDefault(); inputRef.current?.focus(); setIsSearchOpen(false); }
                      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                        event.preventDefault();
                        const options = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="option"]');
                        options?.[(index + (event.key === 'ArrowDown' ? 1 : -1) + filteredBodies.length) % filteredBodies.length]?.focus();
                      }
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-sky-500/20 ${activeIndex === index ? 'bg-sky-500/20' : ''}`}>
                    <span className="font-medium text-white">{body.name}</span>
                    <span className="text-[10px] uppercase font-mono text-zinc-400">{body.type}</span>
                  </button>
                ))}
              </div>
              {!filteredBodies.length && <p role="status" className="px-3 py-2 text-xs text-zinc-400">{query ? 'No matching bodies. Try another name or type.' : 'Type a body name or type to search.'}</p>}
            </div>
          )}
        </div>
        <label className="header-select text-xs text-zinc-300">Scale
          <select aria-label="Display scale" value={scaleMode} onChange={(event) => setScaleMode(event.target.value as ScaleMode)} className="bg-black/60 border border-zinc-700 rounded-lg p-2 text-white">
            <option value="educational">Educational</option><option value="hybrid">Hybrid</option><option value="real">Real (1:1)</option>
          </select>
        </label>
        <label className="header-select text-xs text-zinc-300">Camera
          <select aria-label="Camera mode" value={cameraMode} onChange={(event) => setCameraMode(event.target.value as CameraMode)} className="bg-black/60 border border-zinc-700 rounded-lg p-2 text-white">
            <option value="free">Free</option><option value="focus">Focus</option><option value="follow">Follow</option><option value="top">Top</option><option value="ecliptic">Ecliptic</option>
          </select>
        </label>
      </div>
      <div className="header-actions flex items-center gap-2">
        <button type="button" onClick={onToggleMeasurement} aria-label="Measure distance" aria-expanded={isMeasurementOpen} aria-pressed={isMeasurementOpen} className={`flex items-center gap-1 px-2.5 py-2 text-xs rounded-lg glass-button ${isMeasurementOpen ? 'active' : 'text-zinc-300'}`}>
          <Ruler aria-hidden="true" className="w-4 h-4 text-sky-400" /><span>Measure</span>
        </button>
        <div className="relative" ref={viewMenuRef} onKeyDown={(event) => {
          if (event.key === 'Escape' && isViewMenuOpen) { event.preventDefault(); setIsViewMenuOpen(false); layersButtonRef.current?.focus(); }
        }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsViewMenuOpen(false); }}>
          <button ref={layersButtonRef} type="button" onClick={() => setIsViewMenuOpen((open) => !open)} aria-label="Visual layers" aria-expanded={isViewMenuOpen} aria-controls={layersId} className="flex items-center gap-1 px-2.5 py-2 text-xs rounded-lg glass-button text-zinc-300">
            <Layers aria-hidden="true" className="w-4 h-4 text-amber-400" /><span>Layers</span><ChevronDown aria-hidden="true" className="w-3 h-3" />
          </button>
          {isViewMenuOpen && <div id={layersId} role="group" aria-label="Visual layers" className="header-layers-popup absolute right-0 mt-2 w-52 glass-panel rounded-lg border border-zinc-700/80 shadow-2xl py-1.5 z-50 text-xs">
            {[
              { key: 'showOrbits', label: 'Orbit paths' }, { key: 'showLabels', label: 'Labels' },
              { key: 'showHabitableZone', label: 'Habitable zone' }, { key: 'showAsteroidBelt', label: 'Asteroid belt' },
              { key: 'showKuiperBelt', label: 'Kuiper belt' }, { key: 'showMoons', label: 'Moons' },
              { key: 'showLighting', label: 'Sun day/night lighting' }, { key: 'showDistanceGrid', label: 'Ecliptic grid' },
            ].map(({ key, label }) => {
              const active = viewToggles[key as keyof typeof viewToggles];
              return <button type="button" key={key} aria-pressed={active} onClick={() => toggleView(key as keyof typeof viewToggles)} className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-white/10">
                <span className={active ? 'text-white' : 'text-zinc-400'}>{label}</span>{active && <Check aria-hidden="true" className="w-4 h-4 text-sky-400" />}
              </button>;
            })}
          </div>}
        </div>
        <button type="button" onClick={onOpenHelp} aria-label="Open astronomical guide and controls" aria-haspopup="dialog" className="flex items-center gap-1 px-2.5 py-2 text-xs text-zinc-300 glass-button rounded-lg">
          <HelpCircle aria-hidden="true" className="w-4 h-4" /><span>Help</span>
        </button>
      </div>
    </header>
  );
};
