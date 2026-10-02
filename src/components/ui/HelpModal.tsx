/**
 * 3D Solar System Simulator — Astronomical Guide & Controls Modal
 */

import React from 'react';
import { X, BookOpen, MousePointer, Orbit, Clock, Eye, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl glass-panel rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Astronomical Simulator Field Manual
              </h2>
              <p className="text-xs text-zinc-400">
                Keplerian orbital dynamics & interactive exploration guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-300">
          {/* Section 1: Navigation Controls */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-sky-400" /> Navigation & Controls
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
              <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-lg">
                <span className="text-sky-300 block font-bold">Left Click + Drag</span>
                <span className="text-zinc-400 text-[11px]">Rotate camera around focal point</span>
              </div>
              <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-lg">
                <span className="text-sky-300 block font-bold">Right Click + Drag</span>
                <span className="text-zinc-400 text-[11px]">Pan camera across the ecliptic plane</span>
              </div>
              <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-lg">
                <span className="text-sky-300 block font-bold">Mouse Wheel / Pinch</span>
                <span className="text-zinc-400 text-[11px]">Zoom smoothly in and out</span>
              </div>
              <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-lg">
                <span className="text-sky-300 block font-bold">Click Celestial Body</span>
                <span className="text-zinc-400 text-[11px]">Select body & open dynamic telemetry</span>
              </div>
            </div>
          </div>

          {/* Section 2: Physics Engine */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Orbit className="w-4 h-4 text-amber-400" /> Kepler's Laws vs. Simple Animations
            </h3>
            <p className="leading-relaxed mb-2 text-zinc-300">
              Unlike arcade games or decorative 3D loops, this simulator solves **Kepler's Equation**{' '}
              <code className="text-amber-300 bg-black/60 px-1 py-0.5 rounded font-mono">
                M = E - e·sin(E)
              </code>{' '}
              via numerical Halley/Newton-Raphson iteration on every frame:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>
                <strong className="text-white">1st Law (Ellipses):</strong> Planets move in true ellipses with the Sun at one focus.
              </li>
              <li>
                <strong className="text-white">2nd Law (Equal Areas):</strong> Bodies accelerate near perihelion and decelerate at aphelion (readily visible on comets like Halley!).
              </li>
              <li>
                <strong className="text-white">3rd Law (Harmonics):</strong> The square of orbital period is proportional to the cube of semi-major axis (<code className="text-amber-300 font-mono">P² = a³</code>).
              </li>
            </ul>
          </div>

          {/* Section 3: Scale Modes */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" /> Scale Modes Explained
            </h3>
            <div className="space-y-2">
              <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-lg">
                <div className="font-semibold text-emerald-300 mb-0.5">Educational Scale (Default)</div>
                <p className="text-zinc-400 text-[11px]">
                  Orbits are smoothly compressed and planetary spheres are scaled for optimal viewing on desktop monitors, allowing you to appreciate planetary textures while observing orbital patterns.
                </p>
              </div>
              <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-lg">
                <div className="font-semibold text-sky-300 mb-0.5">Real Scale (1:1 Physical Scale)</div>
                <p className="text-zinc-400 text-[11px]">
                  1 Astronomical Unit equals 500 units. True proportions show the mind-boggling, awe-inspiring emptiness of the Solar System. Use the "Focus" button to zoom in close to any planet.
                </p>
              </div>
              <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-lg">
                <div className="font-semibold text-indigo-300 mb-0.5">Hybrid / Logarithmic Scale</div>
                <p className="text-zinc-400 text-[11px]">
                  Distances scale logarithmically with <code className="text-zinc-200 font-mono">log(1 + 9·r)</code>, preserving proportional outer Solar System spacing up to Pluto and comets.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Simulation Clock */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> Time Travel & Historical Alignments
            </h3>
            <p className="leading-relaxed text-zinc-300">
              Control simulation time with play, pause, reverse, single-day steps, or speeds up to 10 years per second. Use the <strong>Historic Events</strong> button to witness historical milestones like Apollo 11, the Voyager 1 Pale Blue Dot portrait, the 2020 Great Conjunction, or fast forward to Halley's Comet perihelion in 2061!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-black/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs rounded-lg transition-colors"
          >
            Got it, Let's Explore
          </button>
        </div>
      </div>
    </div>
  );
};
