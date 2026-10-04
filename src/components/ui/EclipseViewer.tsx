import { useEffect, useId, useRef, useState } from 'react';
import { Pause, Play, X } from 'lucide-react';
import type { HistoricEvent } from '../../astronomy/constants';
import { eclipseGeometry } from '../../astronomy/eclipseGeometry';

/** A separate educational view avoids inventing eclipse alignments in the orbital model. */
export function EclipseViewer({ event, onClose }: { event: HistoricEvent | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState(50);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState<'observer' | 'alignment'>('alignment');
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !event) return;
    setPhase(50);
    setPlaying(false);
    setView('alignment');
    dialog.showModal();
    closeRef.current?.focus();
    return () => dialog.close();
  }, [event]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0, previous = performance.now(), progress = phase;
    const tick = (now: number) => {
      if (!document.hidden) progress += Math.min(now - previous, 100) / 80;
      previous = now;
      setPhase(Math.min(100, progress));
      if (progress < 100) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const close = () => { setPlaying(false); dialogRef.current?.close(); onClose(); };
  const solar = event?.eclipseType === 'solar';
  const geometry = eclipseGeometry(solar ? 'solar' : 'lunar', !!event?.annular, phase);
  const displacement = geometry.diskOffset;
  const status = geometry.status;
  const peak = status === 'Totality' || status === 'Annularity';
  const moonY = 110 + geometry.moonOffset / (solar ? 6000 : 15000) * (solar ? 65 : 78);
  const shadowTip = solar ? 190 + geometry.umbraLength / geometry.moonDistance * 100 : 170 + geometry.umbraLength / geometry.moonDistance * 120;
  const lunarPenumbra = geometry.penumbraRadius / 6371 * 18;

  return (
    <dialog ref={dialogRef} className="help-dialog eclipse-viewer" aria-labelledby={`${id}-title`}
      onCancel={e => { e.preventDefault(); close(); }}>
      <div className="glass-panel">
        <header className="eclipse-heading">
          <div>
            <h2 id={`${id}-title`}>{event?.name}</h2>
            <p>{event?.date.slice(0, 10)} · {solar ? 'Sun → Moon → Earth' : 'Sun → Earth → Moon'}</p>
          </div>
          <button ref={closeRef} onClick={close} className="glass-button" aria-label="Close eclipse viewer"><X size={18} aria-hidden="true" /></button>
        </header>
        <div className="eclipse-content">
          <div className="eclipse-view-tabs" role="group" aria-label="Eclipse perspective">
            <button className="glass-button" aria-pressed={view === 'alignment'} onClick={() => setView('alignment')}>Shadow alignment</button>
            <button className="glass-button" aria-pressed={view === 'observer'} onClick={() => setView('observer')}>Observer view</button>
          </div>
          <svg viewBox="0 0 360 220" role="img" aria-label={view === 'alignment' ? 'Sun, Earth, and Moon with moving eclipse shadows' : solar ? 'Moon passing in front of the Sun' : 'Earth’s shadow passing across the Moon'}>
            <defs>
              <radialGradient id={`${id}-sun`}><stop stopColor="#fff3bd" /><stop offset="1" stopColor="#f5b33e" /></radialGradient>
              <radialGradient id={`${id}-corona`}><stop stopColor="#fff8dc" stopOpacity=".7" /><stop offset="1" stopColor="#fff8dc" stopOpacity="0" /></radialGradient>
              <clipPath id={`${id}-disk`}><circle cx="180" cy="110" r="62" /></clipPath>
              <clipPath id={`${id}-earth-disk`}><circle cx="290" cy="110" r="16" /></clipPath>
              <pattern id={`${id}-moon`} patternUnits="userSpaceOnUse" x="118" y="48" width="124" height="124">
                <image href={`${import.meta.env.BASE_URL}textures/moon.jpg`} width="248" height="124" x="-62" />
              </pattern>
              <pattern id={`${id}-earth`} width="1" height="1" patternContentUnits="objectBoundingBox">
                <image href={`${import.meta.env.BASE_URL}textures/earth.jpg`} width="1" height="1" preserveAspectRatio="xMidYMid slice" />
              </pattern>
            </defs>
            <rect width="360" height="220" rx="16" fill="#06080e" />
            {view === 'alignment' ? <>
              <line x1="40" y1="110" x2="342" y2="110" stroke="#c4d7ef" strokeOpacity=".2" strokeDasharray="4 5" />
              {solar ? <>
                <polygon points={`190,${moonY - 7} 342,${moonY - 34} 342,${moonY + 34} 190,${moonY + 7}`} fill="#d8e4ff" opacity=".12" />
                <polygon points={`190,${moonY - 7} ${shadowTip},${moonY} 190,${moonY + 7}`} fill="#080a12" stroke="#8ca7cc" strokeWidth=".7" />
                {event?.annular && <polygon points={`${shadowTip},${moonY} 342,${moonY - 5} 342,${moonY + 5}`} fill="#d9a855" opacity=".35" />}
                <circle cx="290" cy="110" r="16" fill={`url(#${id}-earth)`} />
                <ellipse cx="282" cy={moonY} rx="3" ry="4" fill="#08090d" opacity={peak ? .9 : .1} clipPath={`url(#${id}-earth-disk)`} />
                <circle cx="190" cy={moonY} r="7" fill="#a4a6ac" />
                <text x="190" y={moonY - 16} textAnchor="middle" fill="#e3e9f3" fontSize="11">Moon</text>
                <text x="290" y="146" textAnchor="middle" fill="#e3e9f3" fontSize="11">Earth</text>
                <text x="255" y="188" textAnchor="middle" fill="#b5c6dc" fontSize="10">{event?.annular ? 'Antumbra: ring of sunlight' : 'Umbra: total shadow'}</text>
              </> : <>
                <polygon points={`170,92 342,${110 - lunarPenumbra} 342,${110 + lunarPenumbra} 170,128`} fill="#d8e4ff" opacity=".13" />
                <polygon points={`170,92 ${shadowTip},110 170,128`} fill="#4f241c" opacity=".6" />
                <circle cx="170" cy="110" r="18" fill={`url(#${id}-earth)`} />
                <circle cx="290" cy={moonY} r="9" fill={peak ? '#b14b32' : '#bdc2cc'} />
                <text x="170" y="150" textAnchor="middle" fill="#e3e9f3" fontSize="11">Earth</text>
                <text x="290" y={moonY - 18} textAnchor="middle" fill="#e3e9f3" fontSize="11">Moon</text>
                <text x="257" y="188" textAnchor="middle" fill="#b5c6dc" fontSize="10">Earth’s umbra and penumbra</text>
              </>}
              <circle cx="40" cy="110" r="32" fill={`url(#${id}-sun)`} />
              <text x="40" y="160" textAnchor="middle" fill="#e3e9f3" fontSize="11">Sun</text>
            </> : solar ? <>
              <circle cx="180" cy="110" r="96" fill={`url(#${id}-corona)`} opacity={peak && !event?.annular ? 1 : .15} />
              <circle cx="180" cy="110" r="62" fill={`url(#${id}-sun)`} />
              <circle cx={180 + displacement} cy="110" r={geometry.moonDiskRadius} fill="#08090d" />
            </> : <>
              <circle cx="180" cy="110" r="62" fill={`url(#${id}-moon)`} />
              <g clipPath={`url(#${id}-disk)`}>
                <circle cx={180 + displacement} cy="110" r={geometry.penumbraRadius / 1737.4 * 62} fill="#171024" opacity=".3" />
                <circle cx={180 + displacement} cy="110" r={geometry.umbraRadius / 1737.4 * 62} fill="#6d1f13" opacity=".8" />
              </g>
            </>}
          </svg>
          <p role="status" className="eclipse-status">{status}</p>
          <div className="eclipse-playback">
            <button className="glass-button" onClick={() => { if (phase >= 100) setPhase(0); setPlaying(value => !value); }}
              aria-label={playing ? 'Pause eclipse illustration' : 'Play eclipse illustration'}>
              {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            </button>
            <label htmlFor={`${id}-phase`}>Eclipse phase</label>
            <input id={`${id}-phase`} type="range" min="0" max="100" step=".1" value={phase}
              onChange={e => { setPlaying(false); setPhase(Number(e.target.value)); }} />
          </div>
          <button className="glass-button eclipse-restart" onClick={() => { setPlaying(false); setPhase(0); }}>Restart eclipse</button>
          <p className="text-ui-secondary">{solar ? 'Move the Moon across the Sun’s line of sight. Its central shadow produces totality; beyond the shadow tip, sunlight forms an annular ring.' : 'Move the Moon through Earth’s shadow. The penumbra dims it; the umbra darkens it and gives totality its red appearance.'}</p>
          <p>{event?.description}</p>
          <p className="text-ui-muted">Illustrative alignment model using physical radii and shadow geometry. Diagram sizes and playback speed are exaggerated for clarity. Event dates are day-level bookmarks; this model does not calculate local visibility or event-specific orbital paths.</p>
          <a href={event?.sourceUrl} target="_blank" rel="noreferrer" className="text-ui-accent underline">NASA event details and visibility</a>
        </div>
      </div>
    </dialog>
  );
}
