import { useEffect, useRef, useState } from 'react';
import { clamp, focusHeight, formatDay, previewHeight, previewLabelSpace, ruler, spanAtZoom, zoomAround, zoomAtSpan } from './model.js';
import { archiveBounds, demoEvents } from './demo.js';

export function Preview({ config, view, setView, bounds = config.zoom, focus, setFocus, overrides = {}, title = 'Arbeitsstand', filter = '', reserveHeight = previewHeight(config), labelSpace = previewLabelSpace(config), animationRef }) {
  const track = useRef(null), drag = useRef(null), ownAnimation = useRef(null);
  const animation = animationRef ?? ownAnimation;
  const live = useRef({ view, config, bounds, setView });
  live.current = { view, config, bounds, setView };
  const [width, setWidth] = useState(900);
  const [hoverEvent, setHoverEvent] = useState(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(track.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { cancelAnimationFrame(animation.current); }, [bounds.minDays, bounds.maxDays]);
  const animate = (next, duration) => {
    cancelAnimationFrame(animation.current);
    const from = live.current.view, began = performance.now();
    if (!duration || matchMedia('(prefers-reduced-motion: reduce)').matches) { setView(next); return; }
    const frame = now => {
      const t = clamp((now - began) / duration, 0, 1), ease = 1 - (1 - t) ** 3;
      setView({ ...next, center: from.center + (next.center - from.center) * ease, span: Math.exp(Math.log(from.span) + Math.log(next.span / from.span) * ease) });
      if (t < 1) animation.current = requestAnimationFrame(frame);
    };
    animation.current = requestAnimationFrame(frame);
  };
  useEffect(() => {
    const el = track.current;
    const wheel = e => {
      e.preventDefault(); cancelAnimationFrame(animation.current);
      const { view: v, config: c, bounds: b, setView: update } = live.current;
      const rect = el.getBoundingClientRect();
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) update({ ...v, center: v.center + (e.deltaX || e.deltaY) / rect.width * v.span });
      else {
        const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1);
        const next = spanAtZoom(zoomAtSpan(v.span, b) - delta * c.zoom.sensitivity, b);
        update(zoomAround(v, next, c.zoom.anchor === 'pointer' ? clamp((e.clientX - rect.left) / rect.width, 0, 1) : 0.5));
      }
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => { el.removeEventListener('wheel', wheel); cancelAnimationFrame(animation.current); };
  }, []);
  const start = view.center - view.span / 2, end = view.center + view.span / 2;
  const { ticks, omitted, pxPerDay } = ruler(config, start, end, width, overrides);
  const events = demoEvents(start, end);
  const archive = archiveBounds(view), archiveSpan = archive.end - archive.start;
  const mapEvents = demoEvents(archive.start, archive.end);
  const tooltip = events.find(e => e.id === hoverEvent);
  const effectiveFocus = focus.mode === 'none' ? null : focus.mode === 'fixed' ? focus.fixed : focus.hover ?? (config.hover.keepSelection ? focus.selected : null);
  const pointDay = e => start + clamp((e.clientX - track.current.getBoundingClientRect().left) / width, 0, 1) * view.span;
  const changeZoom = zoom => animate(zoomAround(view, spanAtZoom(zoom, bounds)), config.zoom.durationMs);
  return <article className="preview" style={{ background: config.appearance.background, '--preview-accent': config.appearance.accent, '--label': config.appearance.labelColor }}>
    <header className="preview-header"><span className="eyebrow">{title}</span><span className="mono">{view.span.toFixed(1)} TAGE · {Math.round(width)} PX</span></header>
    {config.appearance.showLabels && config.mode === 'calendar' && <div className="calendar-context" aria-label="Kalenderkontext">{formatDay(view.center, { month: 'long', year: 'numeric' })}</div>}
    <div className="time-track" ref={track} style={{ height: reserveHeight + labelSpace + 26 }} tabIndex={0} role="application" aria-label={`Timeline ${title}. Pfeiltasten verschieben, Plus und Minus zoomen.`}
      onKeyDown={e => {
        if (['ArrowLeft', 'ArrowRight', '+', '=', '-'].includes(e.key)) {
          e.preventDefault();
          if (e.key.startsWith('Arrow')) { cancelAnimationFrame(animation.current); setView({ ...view, center: view.center + (e.key === 'ArrowLeft' ? -1 : 1) * view.span / 10 }); }
          else changeZoom(zoomAtSpan(view.span, bounds) + (e.key === '-' ? -1 : 1) * config.zoom.buttonStep);
        }
      }}
      onPointerDown={e => { if (e.button !== 0 || e.target.closest('button')) return; cancelAnimationFrame(animation.current); track.current.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, center: view.center, span: view.span, moved: false }; }}
      onPointerMove={e => {
        if (drag.current) { const d = drag.current; if (Math.abs(e.clientX - d.x) > 3) d.moved = true; setView({ ...view, center: d.center - (e.clientX - d.x) / width * d.span }); }
        setFocus(f => ({ ...f, hover: pointDay(e) }));
      }}
      onPointerUp={e => { if (drag.current && !drag.current.moved) setFocus(f => ({ ...f, selected: pointDay(e) })); drag.current = null; if (track.current.hasPointerCapture(e.pointerId)) track.current.releasePointerCapture(e.pointerId); }}
      onPointerCancel={() => { drag.current = null; }}
      onPointerLeave={() => { if (!drag.current) { setFocus(f => ({ ...f, hover: null })); setHoverEvent(null); } }}>
      {effectiveFocus != null && effectiveFocus >= start && effectiveFocus < end && <div className="focus-guide" style={{ bottom: labelSpace, left: `${(effectiveFocus - start) / view.span * 100}%` }}><span>{formatDay(effectiveFocus)}</span></div>}
      <div className="ruler" style={{ bottom: labelSpace, height: reserveHeight, borderColor: config.appearance.baseline }}>
        {ticks.map(t => <span className="tick" key={t.day} data-kind={t.kind} data-day={t.day} style={{ left: `${(t.day - start) / view.span * 100}%` }}><i style={{ opacity: t.opacity * t.style.opacity, height: focusHeight(t.height, t.day, effectiveFocus, pxPerDay, config.hover), width: t.tickWidth, background: t.style.color, borderRadius: t.style.radius, transitionDuration: `${config.hover.durationMs}ms` }} />{config.appearance.showLabels && t.label && <small style={{ fontSize: t.labelStyle.size, fontWeight: t.labelStyle.weight, opacity: t.labelStyle.opacity * t.opacity }} data-label-kind={t.kind}>{t.label}</small>}</span>)}
        {config.appearance.showEvents && events.map(e => {
          const tick = ticks.reduce((nearest, t) => !nearest || Math.abs(t.day - e.day) < Math.abs(nearest.day - e.day) ? t : nearest, null);
          const height = focusHeight(tick?.height ?? 20, e.day, effectiveFocus, pxPerDay, config.hover);
          return <button key={e.id} className={`event-mark ${filter && filter !== e.theme ? 'dimmed' : ''} ${focus.selected === e.day ? 'selected' : ''}`} style={{ left: `${(e.day - start) / view.span * 100}%`, '--event-color': e.color }} aria-label={`${title}: ${formatDay(e.day)}, ${e.title}, Demo`} aria-pressed={focus.selected === e.day} onPointerEnter={() => setHoverEvent(e.id)} onPointerLeave={() => setHoverEvent(null)} onFocus={() => { setHoverEvent(e.id); setFocus(f => ({ ...f, hover: e.day })); }} onBlur={() => { setHoverEvent(null); setFocus(f => ({ ...f, hover: null })); }} onClick={() => setFocus(f => ({ ...f, selected: e.day }))}><i style={{ height, transitionDuration: `${config.hover.durationMs}ms` }} /></button>;
        })}
      </div>
      {tooltip && <div role="tooltip" className="event-tooltip" style={{ left: `${clamp((tooltip.day - start) / view.span * 100, 18, 82)}%` }}><span className="eyebrow">DEMO · {formatDay(tooltip.day)}</span><strong>{tooltip.title}</strong></div>}
    </div>
    {omitted.length > 0 && <p className="notice">Mehr als 5.000 Marken: feinste Ebenen ausgelassen ({omitted.join(', ')}).</p>}
    <div className="zoom-row"><button disabled={bounds.minDays === bounds.maxDays} aria-label={`${title}: herauszoomen`} onClick={() => changeZoom(zoomAtSpan(view.span, bounds) - config.zoom.buttonStep)}>−</button><input disabled={bounds.minDays === bounds.maxDays} aria-label={`${title}: Zoom`} type="range" min="0" max="100" step="0.1" value={clamp(zoomAtSpan(view.span, bounds), 0, 100)} onChange={e => { cancelAnimationFrame(animation.current); setView(zoomAround(view, spanAtZoom(Number(e.target.value), bounds))); }} /><button disabled={bounds.minDays === bounds.maxDays} aria-label={`${title}: hineinzoomen`} onClick={() => changeZoom(zoomAtSpan(view.span, bounds) + config.zoom.buttonStep)}>+</button><span className="mono">{formatDay(start)} — {formatDay(end)}</span></div>
    <div className="minimap" role="slider" tabIndex={0} aria-label={`${title}: Minimap`} aria-valuemin={archive.start} aria-valuemax={archive.end} aria-valuenow={view.center} aria-valuetext={formatDay(view.center)} onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); cancelAnimationFrame(animation.current); setView({ ...view, center: view.center + (e.key === 'ArrowLeft' ? -1 : 1) * view.span / 2 }); } }} onPointerDown={e => { if (e.button !== 0) return; cancelAnimationFrame(animation.current); const rect = e.currentTarget.getBoundingClientRect(); setView({ ...view, center: archive.start + clamp((e.clientX - rect.left) / rect.width, 0, 1) * archiveSpan }); }}>
      {mapEvents.map(e => <i key={e.id} style={{ left: `${(e.day - archive.start) / archiveSpan * 100}%`, background: e.color, opacity: !filter || filter === e.theme ? 0.7 : 0.1 }} />)}
      <span className="map-window" style={{ left: `${(start - archive.start) / archiveSpan * 100}%`, width: `${view.span / archiveSpan * 100}%` }} />
    </div>
    <div className="map-caption"><span>{formatDay(archive.start, { month: 'short', year: 'numeric' })}</span><span>MINIMAP · KLICK ZUM SPRINGEN</span><span>{formatDay(archive.end, { month: 'short', year: 'numeric' })}</span></div>
  </article>;
}
