import test from 'node:test';
import assert from 'node:assert/strict';
import { cloneConfig, DEFAULT_CONFIG, validateConfig } from '../src/config.js';
import { calendarWeek, dayOf, focusHeight, hoverWeight, ruler, zoomAround } from '../src/model.js';

test('Zoom erhält den Zeitanker', () => {
  const view = { center: dayOf('2025-08-01'), span: 153 };
  const next = zoomAround(view, 7, 0.23);
  assert.ok(Math.abs((view.center + (0.23 - 0.5) * view.span) - (next.center + (0.23 - 0.5) * next.span)) < 1e-9);
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
