import test from 'node:test';
import assert from 'node:assert/strict';
import { cloneConfig, DEFAULT_CONFIG, validateConfig } from '../src/config.js';
import { calendarWeek, cameraScale, dayOf, focusHeight, hoverWeight, monthMiddle, previewHeight, ruler, zoomAround } from '../src/model.js';

test('Zoom erhält den Zeitanker', () => {
  const view = { center: dayOf('2025-08-01'), span: 153 };
  const next = zoomAround(view, 7, 0.23);
  assert.ok(Math.abs((view.center + (0.23 - 0.5) * view.span) - (next.center + (0.23 - 0.5) * next.span)) < 1e-9);
});

test('Monatsmitten und zwölf echte Jahresintervalle ohne doppelte Grenzen', () => {
  for (const [month, expected] of [['2025-01-01','2025-01-16'],['2025-02-01','2025-02-15'],['2024-02-01','2024-02-15'],['2025-04-01','2025-04-16']]) assert.equal(monthMiddle(dayOf(month)), dayOf(expected));
  const { ticks } = ruler(DEFAULT_CONFIG, dayOf('2025-01-01'), dayOf('2026-01-01'), 1400);
  assert.equal(ticks.filter(t => ['year','month'].includes(t.kind)).length, 12);
  assert.equal(ticks.filter(t => t.kind === 'monthMiddle').length, 12);
  assert.equal(new Set(ticks.map(t=>t.day)).size, ticks.length);
  assert.equal(ticks.find(t=>t.day===dayOf('2025-06-16')).kind,'monthMiddle');
  assert.equal(ticks.find(t=>t.day===dayOf('2025-09-01')).kind,'month');
});

test('Kamera wächst kontinuierlich bei festem Viewport; Labels sind zentriert und kollisionsfrei', () => {
  const config = cloneConfig(DEFAULT_CONFIG);
  const height = previewHeight(config);
  const scales = [365, 153, 30, 7, 1].map(span=>cameraScale(config,span));
  scales.slice(1).forEach((s,i)=>{ assert.ok(s.height>scales[i].height); assert.ok(s.width>=scales[i].width && s.width<=config.camera.maxWidthFactor); });
  for (const span of [365,153,30,7,1]) {
    const { ticks }=ruler(config,dayOf('2025-06-01'),dayOf('2025-06-01')+span,1200);
    assert.equal(previewHeight(config),height);
    const labels=ticks.filter(t=>t.label);
    for (const t of labels) { assert.equal(t.labelOffset,0); if(t.kind==='week') assert.match(t.label,/^KW\n\d+$/); }
    const sorted=labels.map(t=>t.labelBounds).sort((a,b)=>a[0]-b[0]);
    sorted.slice(1).forEach(([left],i)=>assert.ok(left>=sorted[i][1]));
    if(span===1) assert.ok(ticks.find(t=>t.kind==='month').height>height);
  }
});

test('Alte Konfigurationen erhalten Klassen, Werte und freies Raster; Erweiterungen bleiben ausschaltbar', () => {
  const old=cloneConfig(DEFAULT_CONFIG); delete old.camera; delete old.labels; delete old.calendar.monthMiddle;
  const oldJSON=JSON.stringify(old);
  const normalized=validateConfig(old);
  assert.equal(JSON.stringify(old),oldJSON);
  assert.deepEqual(normalized.classes,old.classes); assert.deepEqual(normalized.free,old.free); assert.deepEqual(normalized.zoom,old.zoom);
  assert.equal(normalized.calendar.monthMiddle.enabled,false); assert.equal(normalized.camera.enabled,false); assert.equal(normalized.labels.dynamic,false);
  assert.deepEqual(validateConfig(JSON.parse(JSON.stringify(normalized))),normalized);
  assert.throws(()=>validateConfig({...normalized,camera:{...normalized.camera,heightExponent:-1}}),/Längenwachstum/);
});
test('Kalender erhält Schalttag, Monatsgrenze, Montag und ISO-Woche', () => {
  const { ticks } = ruler(DEFAULT_CONFIG, dayOf('2024-02-26'), dayOf('2024-03-05'), 1000);
  assert.equal(ticks.find(t => t.day === dayOf('2024-02-29')).kind, 'day');
  assert.equal(ticks.find(t => t.day === dayOf('2024-03-01')).kind, 'month');
  assert.equal(ticks.find(t => t.day === dayOf('2024-03-04')).kind, 'week');
  assert.deepEqual(calendarWeek(dayOf('2024-12-30')), { year: 2025, week: 1 });
});
test('Hoverradius bleibt bei zwei Skalen in CSS-Pixeln konstant; JSON erhält Konfiguration', () => {
  for (const curve of ['compact', 'cosine', 'smoothstep']) {
    const hover = { ...DEFAULT_CONFIG.hover, curve };
    for (const scale of [4, 100]) {
      assert.equal(focusHeight(20, 40 / scale, 0, scale, hover), 5);
      assert.equal(focusHeight(20, 20 / scale, 0, scale, hover), 5 + 76 * hoverWeight(20, hover));
    }
  }
  const config = cloneConfig(DEFAULT_CONFIG);
  assert.deepEqual(validateConfig(JSON.parse(JSON.stringify(config))), config);
});
