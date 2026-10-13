import { DAY, dayOf } from './model.js';

export const themes = [
  { id: 'agenten', name: 'Agenten', color: '#91a9d4' },
  { id: 'design', name: 'Design', color: '#c6b581' },
  { id: 'programmieren', name: 'Code', color: '#8dbdca' },
  { id: 'infrastruktur', name: 'Infrastruktur', color: '#84b9aa' },
];
const titles = ['Werkzeuge mit klaren Rollen verbinden', 'Vom Designsystem zum Produkt', 'Ein lokales Projekt entwickeln', 'Eine Verbindung erproben'];

export function demoEvents(start, end) {
  const first = new Date(start * DAY);
  let month = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1) / DAY;
  const events = [];
  while (month < end) {
    const date = new Date(month * DAY);
    themes.forEach((theme, i) => {
      const day = month + [2, 8, 15, 23][i] + 0.5;
      if (day >= start && day < end) events.push({ id: `${date.getUTCFullYear()}-${date.getUTCMonth()}-${theme.id}`, day, theme: theme.id, title: titles[i], color: theme.color });
    });
    month = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1) / DAY;
  }
  return events;
}
export const archiveBounds = view => ({ start: Math.min(dayOf('2024-11-01'), view.center - view.span / 2 - 30), end: Math.max(dayOf('2026-01-01'), view.center + view.span / 2 + 30) });
