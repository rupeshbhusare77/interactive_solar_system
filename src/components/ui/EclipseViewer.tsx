import { useEffect, useId, useRef, useState } from 'react';
import { Pause, Play, X } from 'lucide-react';
import type { HistoricEvent } from '../../astronomy/constants';

/** A separate educational view avoids inventing eclipse alignments in the orbital model. */
export function EclipseViewer({ event, onClose }: { event: HistoricEvent | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState(50);
  const [playing, setPlaying] = useState(false);
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !event) return;
    setPhase(50);
    setPlaying(false);
    dialog.showModal();
    closeRef.current?.focus();
    return () => dialog.close();
  }, [event]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0, previous = performance.now(), progress = 0;
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
  const displacement = (phase - 50) * 4.5;
  const separation = Math.abs(displacement);
  const peak = solar ? separation <= (event?.annular ? 7 : .5) : separation <= 33;
  const status = peak ? event?.annular ? 'Annularity' : 'Totality' : separation < (solar ? 124 : 157) ? 'Partial eclipse' : 'Before or after eclipse';

  return (
    <dialog ref={dialogRef} className="help-dialog eclipse-viewer" aria-labelledby={`${id}-title`}
      onCancel={e => { e.preventDefault(); close(); }}>
      <div className="glass-panel">
        <header className="eclipse-heading">
          <div>
            <h2 id={`${id}-title`}>{event?.name}</h2>
            <p>{event?.date.slice(0, 10)} · {solar ? 'Sun → Moon → Earth' : 'Sun → Earth → Moon'}</p>
          </div>
          <button ref={closeRef} onClick={close} className="glass-button" aria-label="Close eclipse viewer"><X size={18} /></button>
        </header>
        <div className="eclipse-content">
          <svg viewBox="0 0 360 220" role="img" aria-label={solar ? 'Moon passing in front of the Sun' : 'Earth’s shadow passing across the Moon'}>
            <defs>
              <radialGradient id={`${id}-sun`}><stop stopColor="#fff3bd" /><stop offset="1" stopColor="#f5b33e" /></radialGradient>
              <radialGradient id={`${id}-corona`}><stop stopColor="#fff8dc" stopOpacity=".7" /><stop offset="1" stopColor="#fff8dc" stopOpacity="0" /></radialGradient>
              <clipPath id={`${id}-disk`}><circle cx="180" cy="110" r="62" /></clipPath>
              <pattern id={`${id}-moon`} patternUnits="userSpaceOnUse" x="118" y="48" width="124" height="124">
                <image href={`${import.meta.env.BASE_URL}textures/moon.jpg`} width="248" height="124" x="-62" />
              </pattern>
            </defs>
            <rect width="360" height="220" rx="16" fill="#06080e" />
            {solar ? <>
              <circle cx="180" cy="110" r="96" fill={`url(#${id}-corona)`} opacity={peak && !event?.annular ? 1 : .15} />
              <circle cx="180" cy="110" r="62" fill={`url(#${id}-sun)`} />
              <circle cx={180 + displacement} cy="110" r={event?.annular ? 55 : 62.5} fill="#08090d" />
            </> : <>
              <circle cx="180" cy="110" r="62" fill={`url(#${id}-moon)`} />
              <g clipPath={`url(#${id}-disk)`}>
                <circle cx={180 + displacement} cy="110" r="105" fill="#171024" opacity=".3" />
                <circle cx={180 + displacement} cy="110" r="95" fill="#6d1f13" opacity=".8" />
              </g>
            </>}
          </svg>
          <p role="status" className="eclipse-status">{status}</p>
          <div className="eclipse-playback">
            <button className="glass-button" onClick={() => { if (!playing) setPhase(0); setPlaying(value => !value); }}
              aria-label={playing ? 'Pause eclipse illustration' : 'Play eclipse illustration'}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <label htmlFor={`${id}-phase`}>Eclipse phase</label>
            <input id={`${id}-phase`} type="range" min="0" max="100" step=".1" value={phase}
              onChange={e => { setPlaying(false); setPhase(Number(e.target.value)); }} />
          </div>
          <p>{event?.description}</p>
          <p className="text-ui-muted">Illustrative viewer; geometry, timing, and sizes are not to scale. The timeline uses a day-level bookmark at 12:00 UTC. The orbital scene does not reconstruct this eclipse or predict local visibility.</p>
          <a href={event?.sourceUrl} target="_blank" rel="noreferrer" className="text-ui-accent underline">NASA event details and visibility</a>
        </div>
      </div>
    </dialog>
  );
}
