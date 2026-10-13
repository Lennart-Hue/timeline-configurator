export const DAY = 86400000;
export const dayOf = date => Date.parse(date) / DAY;
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const dateInput = day => new Date(day * DAY).toISOString().slice(0, 10);
export const formatDay = (day, options = { day: '2-digit', month: 'short', year: 'numeric' }) => new Intl.DateTimeFormat('de-DE', { ...options, timeZone: 'UTC' }).format(day * DAY);
export const smoothstep = v => { const t = clamp(v, 0, 1); return t * t * (3 - 2 * t); };
export const spanAtZoom = (zoom, bounds) => bounds.maxDays * (bounds.minDays / bounds.maxDays) ** (clamp(zoom, 0, 100) / 100);
export const zoomAtSpan = (span, bounds) => bounds.minDays === bounds.maxDays ? 0 : 100 * Math.log(span / bounds.maxDays) / Math.log(bounds.minDays / bounds.maxDays);
export function zoomAround(view, span, anchor = 0.5) {
  return { ...view, center: view.center + (anchor - 0.5) * (view.span - span), span };
}
export function weekStart(day) { return Math.floor(day) - (new Date(day * DAY).getUTCDay() + 6) % 7; }
export function calendarWeek(day) {
  const thursday = weekStart(day) + 3;
  const year = new Date(thursday * DAY).getUTCFullYear();
  return { year, week: 1 + Math.round((weekStart(thursday) - weekStart(Date.UTC(year, 0, 4) / DAY)) / 7) };
}
export const hoverWeight = (distancePx, hover) => {
  const t = Math.abs(distancePx) / hover.radiusPx;
  if (t >= 1) return 0;
  const cosine = (1 + Math.cos(Math.PI * t)) / 2;
  return hover.curve === 'compact' ? cosine ** 2 : hover.curve === 'cosine' ? cosine : 1 - smoothstep(t);
};
export const focusHeight = (base, day, focus, pxPerDay, hover) => focus == null ? base : base * hover.restFactor + hover.bumpPx * hoverWeight((day - focus) * pxPerDay, hover);

const calendarSpacing = (day, kind) => {
  const d = new Date(day * DAY), y = d.getUTCFullYear(), m = d.getUTCMonth();
  return kind === 'year' ? (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1)) / DAY : kind === 'month' ? (Date.UTC(y, m + 1, 1) - Date.UTC(y, m, 1)) / DAY : kind === 'week' ? 7 : 1;
};

export function ruler(config, start, end, width, overrides = {}) {
  const ticks = new Map(), pxPerDay = width / (end - start), omitted = [];
  const add = (day, kind, spec, spacing, label) => {
    const key = Math.round(day * 1e8);
    if (ticks.has(key) || overrides[kind] === 'off') return;
    const style = config.classes.find(c => c.id === spec.classId);
    const distance = spacing * pxPerDay;
    const main = kind === 'year' || kind === 'month' || kind === 'segment';
    const density = smoothstep((distance - spec.density.fromPx) / (spec.density.toPx - spec.density.fromPx));
    const opacity = overrides[kind] === 'always' ? 1 : main ? Math.max(0.2, density) : density;
    if (opacity <= 0) return;
    const factor = spec.height.fromFactor + (spec.height.toFactor - spec.height.fromFactor) * smoothstep((distance - spec.height.fromPx) / (spec.height.toPx - spec.height.fromPx));
    ticks.set(key, { day, kind, style, opacity, height: style.height * factor, label });
  };
  if (config.mode === 'calendar') {
    // In UTC bleiben Monatslängen, Schalttage und Montagsgrenzen unabhängig von DST.
    for (let day = Math.ceil(start); day < end; day++) {
      const d = new Date(day * DAY);
      const kind = d.getUTCDate() === 1 ? d.getUTCMonth() === 0 ? 'year' : 'month' : d.getUTCDay() === 1 ? 'week' : 'day';
      const label = kind === 'year' ? String(d.getUTCFullYear()) : kind === 'month' ? formatDay(day, { month: 'short' }).toUpperCase() : kind === 'week' && pxPerDay * 7 >= 55 ? `KW ${calendarWeek(day).week}` : kind === 'day' && pxPerDay >= 28 ? formatDay(day, { day: '2-digit' }) : null;
      add(day, kind, config.calendar[kind], calendarSpacing(day, kind), label);
    }
  } else {
    const anchor = dayOf(config.free.anchor);
    let spacing = config.free.durationDays;
    for (const [i, spec] of config.free.levels.entries()) {
      spacing /= spec.divisions;
      const first = Math.ceil((start - anchor) / spacing - 1e-9), last = Math.ceil((end - anchor) / spacing - 1e-9);
      // Vor Erzeugung der Ebene begrenzen, nie ein großes Array abschneiden.
      if (last - first > 5000) { omitted.push(...config.free.levels.slice(i).map(l => l.id)); break; }
      const kind = i === 0 ? 'segment' : spec.id;
      for (let n = first; n < last; n++) {
        const day = anchor + n * spacing;
        add(day, kind, spec, spacing, i === 0 ? `Segment ${n + 1}` : null);
      }
    }
  }
  const result = [...ticks.values()].sort((a, b) => a.day - b.day);
  const occupied = [];
  // Hauptbeschriftungen bekommen Platz zuerst; Markenpositionen werden nie verschoben.
  for (const t of [...result].filter(t => t.label).sort((a, b) => {
    const priority = t => ['year', 'month', 'segment'].includes(t.kind) ? 0 : 1;
    return priority(a) - priority(b) || a.day - b.day;
  })) {
    const size = t.label.length * 6 + 8;
    const position = (t.day - start) * pxPerDay;
    const left = clamp(position, 0, Math.max(0, width - size));
    if (occupied.some(([a, b]) => left < b && left + size > a)) t.label = null;
    else { occupied.push([left, left + size]); t.labelOffset = left - position; }
  }
  return { ticks: result, omitted, pxPerDay };
}

export const previewHeight = config => {
  const specs = [...Object.values(config.calendar), ...config.free.levels];
  const base = Math.max(...specs.map(s => config.classes.find(c => c.id === s.classId).height * Math.max(s.height.fromFactor, s.height.toFactor)));
  return Math.max(160, base, base * config.hover.restFactor + config.hover.bumpPx);
};
