# TimelineConfig v1 und CSS-Export

JSON enthält die vollständige exportierbare Konfiguration. Vorschauzeitraum, Vorschaufläche, Fokuszustand, Themenfilter, temporäre Ebenenschalter, Presetnamen und die Presetverwaltung bleiben außerhalb davon. Exportiert wird stets der Arbeitsstand.

| Feld | Bedeutung / Einheit |
|---|---|
| `version` | Formatversion, derzeit ausschließlich `1` |
| `mode` | `calendar` oder `free`; beide Rasterkonfigurationen bleiben enthalten |
| `classes[]` | Stabile interne `id`, sichtbarer `name`, `height`/`width`/`radius` in CSS-Pixeln, `color` als `#RRGGBB`, `opacity` von 0 bis 1 |
| `calendar.year/month/week/day.classId` | Größenklasse der Kalendergrenze; Jahr schlägt Monat, Monat schlägt Woche, Woche schlägt Tag |
| `*.density.fromPx/toPx` | Tatsächlicher Abstand benachbarter Marken, zwischen dem die Deckkraft weich von 0 auf 1 steigt. Wichtige Hauptgrenzen behalten mindestens 0,2 Dichtefaktor. |
| `*.height.fromPx/toPx` | Separater Abstandsbereich für die Höhenentwicklung |
| `*.height.fromFactor/toFactor` | Faktoren der Klassenhöhe, weich zwischen Start- und Endwert interpoliert |
| `free.anchor` | UTC-Datum `YYYY-MM-DD` als unveränderter Hauptsegmentanker |
| `free.durationDays` | Hauptsegmentdauer in Tagen; kann gebrochene Tage enthalten |
| `free.levels[]` | Geordnete Hierarchie; erste Ebene `divisions=1`, danach 2 bis 100 Intervalle der jeweils vorherigen Ebene; jede Ebene hat eigene Klassen-, Dichte- und Höhenzuordnung |
| `zoom.minDays/maxDays` | Kleinste und größte sichtbare Zeitspanne in Tagen, logarithmische Abbildung |
| `zoom.sensitivity` | Zoomprozentschritte pro CSS-Pixel vertikaler Scrollbewegung; Zeilen-/Seiten-Deltas werden in Pixel übersetzt |
| `zoom.buttonStep` | Schritt von Zoomtasten und `+`/`−` in Prozent der logarithmischen Zoomskala |
| `zoom.durationMs` | Dauer der Zoomtastenanimation in Millisekunden; Slider und Scrollzoom folgen unmittelbar der Eingabe |
| `zoom.anchor` | `pointer` oder `center` für Scrollzoom; Slider und Tasten verwenden die Mitte |
| `hover.radiusPx` | Radius auf jeder Seite der Fokusposition in CSS-Pixeln, unabhängig vom Zoom |
| `hover.bumpPx` | Zusätzliche Wölbungshöhe in CSS-Pixeln |
| `hover.curve` | `compact` (quadrierte Kosinusglocke), `cosine`, `smoothstep`; jeweils Null am Radius |
| `hover.restFactor` | Faktor der zoomabhängigen Grundhöhe bei vorhandenem Fokus, auch außerhalb der Kurve; ohne Fokus unveränderte Grundhöhe |
| `hover.durationMs` | Dauer des Höhenübergangs in Millisekunden |
| `hover.keepSelection` | Auswahl als Fokus erhalten, wenn der Mauszeiger die Vorschau verlässt; Hover hat Vorrang |
| `appearance` | Hintergrund, Akzent, Grundlinien- und Label-Farbe; Schalter für Beschriftungen und Demo-Ereignisse |

Die Kalenderberechnung verwendet UTC-Tage, echte Monatslängen, Schaltjahre und ISO-Wochen mit Montagsbeginn. Kalenderpositionen werden nicht durch Hover verändert. Zusammenfallende Rastermarken werden einmal gezeichnet; die gröbere Ebene bestimmt ihre Darstellung. Die Vorschau reserviert ausreichend Höhe anhand der Konfiguration, sodass Grundlinie und Vorschauhöhe während Zoom und Hover stabil bleiben.

Der Import prüft Wertebereiche, Formatversion, Klassenreferenzen und notwendige Felder zentral in `src/config.js`. Ohne erfolgreiche Validierung wird die bestehende Konfiguration nicht ersetzt. Es gibt kein automatisches Migrationsverfahren.

## CSS-Ausgabe und spätere Integration

CSS enthält `.timeline-config` mit Variablen für Hintergrund, Akzent, Grundlinie und Beschriftungsfarbe sowie `.timeline-class-<id>` für jede Größenklasse. Die Klassen-IDs bleiben beim Umbenennen, Speichern und JSON-Roundtrip unverändert. Namen der Varianten oder frei editierbare Klassennamen werden nicht in CSS-Selektoren eingesetzt.

CSS allein implementiert keine Rastererzeugung, Kalender-/ISO-Berechnung, zeitliche Ebenenzuordnung, Dichte-/Höheninterpolation, Zoomanker, Drag, Hoverkurve, Auswahlpriorität oder A/B-Synchronisierung. Ein späterer Konfigurationsadapter muss JSON einlesen, diese dynamischen Funktionen berechnen und die Klassen mit dem DOM der bestehenden Timeline verbinden. Die Integration ist nicht Teil dieser Werkbank.
