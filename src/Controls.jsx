export function NumberField({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return <label className="field"><span>{label} <small>{unit}</small></span><input type="number" min={min} max={max} step={step} value={value} onChange={e => { if (e.target.value !== '' && e.target.validity.valid) onChange(Number(e.target.value)); }} /></label>;
}
export function SelectField({ label, value, onChange, children }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={e => onChange(e.target.value)}>{children}</select></label>;
}
export function Toggle({ label, checked, onChange }) {
  return <label className="toggle"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />{label}</label>;
}

export function LevelEditor({ label, level, classes, onChange, override = 'auto', onOverride, main = false, children }) {
  const groupChange = (key, patch) => onChange({ ...level, [key]: { ...level[key], ...patch } });
  return <article className="level-card"><div className="level-heading"><strong>{label}</strong>{children}</div>
    <SelectField label={`${label}: Größenklasse`} value={level.classId} onChange={classId => onChange({ ...level, classId })}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</SelectField>
    <details><summary>Dichte und Höhenentwicklung</summary>
      <p className="hint">Abstände zwischen Marken in CSS-Pixeln.{main ? ' Hauptgrenzen bleiben mindestens schwach sichtbar.' : ''}</p>
      <NumberField label={`${label}: Dichte ab`} value={level.density.fromPx} min={0} max={9999} step={0.1} unit="px" onChange={fromPx => groupChange('density', { fromPx })} />
      <NumberField label={`${label}: Dichte voll`} value={level.density.toPx} min={0.01} max={10000} step={0.01} unit="px" onChange={toPx => groupChange('density', { toPx })} />
      <NumberField label={`${label}: Höhe ab`} value={level.height.fromPx} min={0} max={9999} step={0.1} unit="px" onChange={fromPx => groupChange('height', { fromPx })} />
      <NumberField label={`${label}: Höhe voll`} value={level.height.toPx} min={0.01} max={10000} step={0.01} unit="px" onChange={toPx => groupChange('height', { toPx })} />
      <NumberField label={`${label}: Startfaktor`} value={level.height.fromFactor} min={0} max={2} step={0.05} onChange={fromFactor => groupChange('height', { fromFactor })} />
      <NumberField label={`${label}: Endfaktor`} value={level.height.toFactor} min={0} max={2} step={0.05} onChange={toFactor => groupChange('height', { toFactor })} />
    </details>
    <SelectField label={`${label}: Vorschautest`} value={override} onChange={onOverride}><option value="auto">Automatisch</option><option value="always">Immer zeigen</option><option value="off">Aus</option></SelectField>
  </article>;
}
