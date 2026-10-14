const transition = (fromPx, toPx, fromFactor = 1, toFactor = 1) => ({ density: { fromPx, toPx }, height: { fromPx: 6, toPx: 28, fromFactor, toFactor } });

export const DEFAULT_CONFIG = {
  version: 1,
  mode: 'calendar',
  classes: [
    { id: 'major', name: 'Groß', height: 80, width: 2, color: '#858991', opacity: 1, radius: 1 },
    { id: 'medium', name: 'Mittel', height: 20, width: 1.5, color: '#676b73', opacity: 1, radius: 1 },
    { id: 'fine', name: 'Fein', height: 20, width: 1, color: '#50545c', opacity: 1, radius: 0.5 },
    { id: 'midpoint', name: 'Monatsmitte', height: 44, width: 1.5, color: '#747982', opacity: 1, radius: 1 },
  ],
  calendar: {
    year: { classId: 'major', ...transition(0, 1) },
    month: { classId: 'major', ...transition(0, 1) },
    monthMiddle: { enabled: true, classId: 'midpoint', ...transition(4, 13) },
    week: { classId: 'medium', ...transition(4, 13, 1, 1.5), height: { fromPx: 42, toPx: 196, fromFactor: 1, toFactor: 1.5 } },
    day: { classId: 'fine', ...transition(4, 13) },
  },
  free: {
    anchor: '2025-01-01',
    durationDays: 28,
    levels: [
      { id: 'segment', divisions: 1, classId: 'major', ...transition(0, 1) },
      { id: 'subsegment', divisions: 4, classId: 'medium', ...transition(4, 13) },
      { id: 'detail', divisions: 7, classId: 'fine', ...transition(4, 13) },
    ],
  },
  zoom: { minDays: 1, maxDays: 366, sensitivity: 0.22, buttonStep: 10, durationMs: 420, anchor: 'pointer' },
  camera: { enabled: true, referenceDays: 365, heightExponent: 0.55, widthExponent: 0.18, maxWidthFactor: 2.5 },
  labels: { dynamic: true, baseSizePx: 11, maxScale: 1.5 },
  hover: { radiusPx: 40, bumpPx: 76, curve: 'compact', restFactor: 0.25, durationMs: 160, keepSelection: true },
  appearance: { background: '#0e0f10', accent: '#df9b70', baseline: '#34363b', labelColor: '#98999c', showLabels: true, showEvents: true },
};

export const cloneConfig = config => structuredClone(config);

// Eine zentrale Grenze für Dateiimporte, lokale Wiederherstellung und UI-Eingaben.
export function validateConfig(value) {
  const fail = message => { throw new Error(message); };
  const object = (v, name) => { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(`${name}: Objekt erwartet.`); };
  const number = (v, min, max, name) => { if (!Number.isFinite(v) || v < min || v > max) fail(`${name}: Zahl zwischen ${min} und ${max} erwartet.`); };
  const bool = (v, name) => { if (typeof v !== 'boolean') fail(`${name}: Ja/Nein erwartet.`); };
  const color = (v, name) => { if (typeof v !== 'string' || !/^#[0-9a-f]{6}$/i.test(v)) fail(`${name}: Farbe im Format #RRGGBB erwartet.`); };
  object(value, 'Konfiguration');
  if (value.version !== 1) fail('Unbekannte Formatversion. Unterstützt wird Version 1.');
  value = cloneConfig(value);
  // Fehlende additive Felder erhalten die alte Gestaltung und alle Klassen-IDs.
  if (value.calendar && !Object.hasOwn(value.calendar, 'monthMiddle')) value.calendar.monthMiddle = { enabled: false, classId: value.calendar.week?.classId, ...transition(4, 13) };
  if (!Object.hasOwn(value, 'camera')) value.camera = { ...DEFAULT_CONFIG.camera, enabled: false };
  if (!Object.hasOwn(value, 'labels')) value.labels = { ...DEFAULT_CONFIG.labels, baseSizePx: 10, dynamic: false };
  if (!['calendar', 'free'].includes(value.mode)) fail('Rastermodus muss calendar oder free sein.');
  if (!Array.isArray(value.classes) || !value.classes.length || value.classes.length > 32) fail('1 bis 32 Größenklassen erwartet.');
  const ids = new Set();
  for (const c of value.classes) {
    object(c, 'Größenklasse');
    if (typeof c.id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(c.id) || ids.has(c.id)) fail('Klassen-IDs müssen eindeutig sein und aus Kleinbuchstaben, Ziffern und Bindestrichen bestehen.');
    ids.add(c.id);
    if (typeof c.name !== 'string' || !c.name.trim() || c.name.length > 80) fail('Klassenname: 1 bis 80 Zeichen erwartet.');
    number(c.height, 1, 160, 'Strichhöhe'); number(c.width, 0.5, 12, 'Strichbreite');
    number(c.opacity, 0, 1, 'Deckkraft'); number(c.radius, 0, 20, 'Abrundung'); color(c.color, 'Strichfarbe');
  }
  const level = (v, name) => {
    object(v, name);
    if (!ids.has(v.classId)) fail(`${name}: Größenklasse „${v.classId}“ fehlt.`);
    for (const key of ['density', 'height']) {
      object(v[key], `${name}/${key}`);
      number(v[key].fromPx, 0, 10000, `${name}: Startabstand`);
      number(v[key].toPx, 0.01, 10000, `${name}: Endabstand`);
      if (v[key].toPx <= v[key].fromPx) fail(`${name}: Endabstand muss größer als Startabstand sein.`);
    }
    number(v.height.fromFactor, 0, 2, `${name}: Starthöhe`); number(v.height.toFactor, 0, 2, `${name}: Endhöhe`);
  };
  object(value.calendar, 'Kalenderraster');
  for (const key of ['year', 'month', 'week', 'day']) level(value.calendar[key], key);
  level(value.calendar.monthMiddle, 'Monatsmitte'); bool(value.calendar.monthMiddle.enabled, 'Monatsmitte aktiv');
  object(value.free, 'Freies Raster');
  if (typeof value.free.anchor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.free.anchor) || !Number.isFinite(Date.parse(value.free.anchor)) || new Date(value.free.anchor).toISOString().slice(0, 10) !== value.free.anchor) fail('Zeitanker: gültiges Datum YYYY-MM-DD erwartet.');
  number(value.free.durationDays, 0.01, 3660, 'Hauptsegmentdauer');
  if (!Array.isArray(value.free.levels) || !value.free.levels.length || value.free.levels.length > 8) fail('1 bis 8 freie Rasterebenen erwartet.');
  const levelIds = new Set();
  value.free.levels.forEach((v, i) => {
    level(v, `Freie Ebene ${i + 1}`);
    if (typeof v.id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(v.id) || levelIds.has(v.id)) fail('Freie Ebenen brauchen eindeutige IDs.');
    levelIds.add(v.id);
    number(v.divisions, i ? 2 : 1, i ? 100 : 1, 'Unterteilungen');
    if (!Number.isInteger(v.divisions)) fail('Unterteilungen müssen ganze Zahlen sein.');
  });
  object(value.zoom, 'Zoom');
  number(value.zoom.minDays, 0.1, 3660, 'Kleinste Zeitspanne'); number(value.zoom.maxDays, 0.1, 3660, 'Größte Zeitspanne');
  if (value.zoom.maxDays <= value.zoom.minDays) fail('Die größte Zeitspanne muss größer als die kleinste sein.');
  number(value.zoom.sensitivity, 0.01, 2, 'Scroll-Empfindlichkeit'); number(value.zoom.buttonStep, 1, 50, 'Zoomschritt'); number(value.zoom.durationMs, 0, 2000, 'Zoomanimation');
  if (!['pointer', 'center'].includes(value.zoom.anchor)) fail('Zoomanker muss pointer oder center sein.');
  object(value.camera, 'Kamera-Zoom'); bool(value.camera.enabled, 'Kamera-Zoom aktiv');
  number(value.camera.referenceDays, 1, 3660, 'Kamera-Referenzspanne');
  number(value.camera.heightExponent, 0, 1.5, 'Längenwachstum'); number(value.camera.widthExponent, 0, 1, 'Breitenwachstum'); number(value.camera.maxWidthFactor, 1, 5, 'Maximaler Breitenfaktor');
  object(value.labels, 'Beschriftung'); bool(value.labels.dynamic, 'Dynamische Beschriftung');
  number(value.labels.baseSizePx, 8, 20, 'Basis-Schriftgröße'); number(value.labels.maxScale, 1, 2, 'Maximale Schriftvergrößerung');
  object(value.hover, 'Hover');
  number(value.hover.radiusPx, 1, 300, 'Hoverradius'); number(value.hover.bumpPx, 0, 160, 'Wölbung'); number(value.hover.restFactor, 0, 1, 'Ruhehöhenfaktor'); number(value.hover.durationMs, 0, 2000, 'Hoveranimation');
  if (!['compact', 'cosine', 'smoothstep'].includes(value.hover.curve)) fail('Unbekannte Hoverkurve.');
  bool(value.hover.keepSelection, 'Auswahlfokus');
  object(value.appearance, 'Darstellung');
  for (const key of ['background', 'accent', 'baseline', 'labelColor']) color(value.appearance[key], key);
  bool(value.appearance.showLabels, 'Beschriftungen'); bool(value.appearance.showEvents, 'Ereignisse');
  return cloneConfig(value);
}

export function cssExport(config) {
  const a = config.appearance;
  return `/* TimelineConfig v1 — statische Darstellung; dynamische Werte siehe EXPORT.md. */\n.timeline-config {\n  --timeline-background: ${a.background};\n  --timeline-accent: ${a.accent};\n  --timeline-baseline: ${a.baseline};\n  --timeline-label-color: ${a.labelColor};\n}\n\n${config.classes.map(c => `.timeline-class-${c.id} {\n  height: ${c.height}px;\n  width: ${c.width}px;\n  background: ${c.color};\n  opacity: ${c.opacity};\n  border-radius: ${c.radius}px;\n}`).join('\n\n')}\n`;
}
