/**
 * 3D Solar System Simulator — Astronomical Guide & Controls Modal
 */

import React, { useEffect, useRef } from 'react';
import { REAL_SCALE_AU_UNITS, EDUCATIONAL_DISTANCE_FACTOR, EDUCATIONAL_DISTANCE_EXPONENT, HYBRID_DISTANCE_FACTOR, HYBRID_DISTANCE_MULTIPLIER } from '../../astronomy/scaling';
import { X, BookOpen, MousePointer, Orbit, Clock, Eye } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      closeButtonRef.current?.focus();
      return () => {
        dialog.close();
        previousFocus?.focus();
      };
    }
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog ref={dialogRef} className="help-dialog" aria-labelledby="help-title" onCancel={(event) => { event.preventDefault(); onCloseRef.current(); }}>
      <div className="w-full max-w-2xl glass-panel rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="help-title" className="text-base font-bold text-white tracking-wide">
                Astronomical Simulator Field Manual
              </h2>
              <p className="text-xs text-zinc-400">
                Keplerian orbital dynamics & interactive exploration guide
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef} type="button" aria-label="Close guide" onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 p-6 overflow-y-auto space-y-6 text-xs text-zinc-300">
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
              This educational model solves Kepler's equation{' '}
              <code className="text-amber-300 bg-black/60 px-1 py-0.5 rounded font-mono">
                M = E - e·sin(E)
              </code>{' '}
              using numerical iteration with fixed orbital elements:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>
                <strong className="text-white">1st Law (Ellipses):</strong> Physical coordinates follow ellipses with the Sun at one focus. Compressed display scales distort their shapes.
              </li>
              <li>
                <strong className="text-white">2nd Law (Equal Areas):</strong> Bodies accelerate near perihelion and decelerate at aphelion (readily visible on comets like Halley!).
              </li>
              <li>
                <strong className="text-white">3rd Law (Harmonics):</strong> For solar orbits, period in years and semi-major axis in AU approximately obey <code className="text-amber-300 font-mono">P² = a³</code>. This model uses catalog periods.
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
                  Distances use {EDUCATIONAL_DISTANCE_FACTOR} × r^{EDUCATIONAL_DISTANCE_EXPONENT}, with r in AU. Body sizes are calibrated for visibility rather than a uniform physical scale. Numerical measurements use physical coordinates.
                </p>
              </div>
              <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-lg">
                <div className="font-semibold text-sky-300 mb-0.5">Real Scale (1:1 Physical Scale)</div>
                <p className="text-zinc-400 text-[11px]">
                  1 Astronomical Unit equals {REAL_SCALE_AU_UNITS} world units for distances and spherical radii. Use Focus to inspect individual bodies. Decorative effects remain illustrative.
                </p>
              </div>
              <div className="bg-black/40 border border-zinc-800 p-2.5 rounded-lg">
                <div className="font-semibold text-indigo-300 mb-0.5">Hybrid / Logarithmic Scale</div>
                <p className="text-zinc-400 text-[11px]">
                  Distances use <code className="text-zinc-200 font-mono">{HYBRID_DISTANCE_FACTOR} × ln(1 + {HYBRID_DISTANCE_MULTIPLIER}r)</code>, with r in AU. Body sizes are calibrated for visibility; numerical measurements use physical coordinates.
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
              Control simulation time with play, pause, reverse, single-day steps, or speeds up to 10 years per second. Historic Events select a date and body; they do not recreate spacecraft missions or guarantee observed alignments. Future comet returns are approximate.
            </p>
            <p className="leading-relaxed text-zinc-400 mt-2">
              Applying a UTC date or choosing a historic event pauses playback for inspection. Use Resume to continue. Reset returns the clock to the current UTC date and pauses playback; camera, scale, layers, and selection stay as you set them.
              Dates are entered and displayed in UTC, within the 1800–2100 navigation range.
              Calculation time approximates dynamical time with the UTC timestamp; leap seconds and
              TT/TDB offsets are omitted. The range is a visualization limit, not an accuracy guarantee.
              Fixed ellipses omit gravitational perturbations and precession. Satellite phases and
              static pole orientations may be illustrative; body metadata identifies their status.
              Surface rotation has an arbitrary prime meridian, so textures, seasons, lunar phases,
              eclipses, and night lighting must not be used for observation planning.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-3 border-t border-zinc-800 bg-black/40 flex justify-end">
          <button
            type="button" onClick={onClose}
            className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs rounded-lg transition-colors"
          >
            Got it, Let's Explore
          </button>
        </div>
      </div>
    </dialog>
  );
};
