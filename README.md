# Timeline-Werkbank

Eigenständige lokale React/Vite-App für die Gestaltung einer horizontalen Timeline. Alle Ereignisse sind synthetische Demodaten.

Erster veröffentlichter Stand: **v.01** (Paketversion `0.1.0`). Neue Versionen werden erst nach ausdrücklicher Freigabe des Repository-Eigentümers auf GitHub veröffentlicht.

## Starten

```sh
cd timeline-configurator
npm ci
npm run dev -- --strictPort
```

Vorschau: `http://127.0.0.1:4174/`. Der Server bindet ausschließlich an die lokale Loopback-Adresse. Bei belegtem Port einen freien Port über `--port` wählen.

```sh
npm test
npm run build
```

## Bedienung

- Die Vorschau bleibt beim Scrollen sichtbar. Scrollen über der Timeline zoomt am Mauszeiger oder der Mitte; horizontales Scrollen und Shift+Scroll verschieben den Ausschnitt. Ziehen verschiebt, Klick hält eine Auswahl fest. Pfeiltasten verschieben, `+`/`−` zoomen.
- Die Vorschaufläche lässt sich begrenzen. Ein Zeitraum kann im Bereich **Zoom und Dichte** eingestellt werden; er wird auf die gewählten Zoomgrenzen begrenzt. **Kein Fokus** und **Festgehaltener Punkt** stellen reproduzierbare Vorschauzustände her.
- Größenklassen und Ebenenzuordnungen sind unabhängig. Monatsmitten haben eine eigene aktivierbare Ebene mit echter Kalenderlänge. Eine Klasse kann erst gelöscht werden, wenn alle Kalender- und freien Ebenen neu zugeordnet sind. Beide Raster behalten ihre Einstellungen beim Umschalten.
- Dichte und Höhenentwicklung sind je Ebene aufklappbar. Abstände werden in CSS-Pixeln gemessen. Hauptgrenzen bleiben bei automatischer Dichte mindestens schwach sichtbar. Temporäre Vorschautests **Immer zeigen** und **Aus** sind nicht Teil des Exports.
- **Kamera-Zoom und Beschriftung** steuert kontinuierliches Längenwachstum, begrenztes Breitenwachstum und platzabhängige Typografie. **Kalenderjahr zeigen** stellt das Jahr um den Mittelpunkt her; Zoomgrenzen können es begrenzen. Der neue Ausgangsstand nutzt 1 bis 366 Tage. Alte Konfigurationen behalten ihre bisherigen Zoomwerte und starten mit deaktivierten Erweiterungen. Labels bleiben zentriert, KW zweizeilig; überlange Striche werden im festen Viewport oben abgeschnitten.
- Das freie Raster verwendet einen festen Zeitanker und eine Hauptdauer in Tagen. Jede Unterebene unterteilt die vorherige. Vier Intervalle erzeugen drei zusätzliche innere Striche. Mehr als 5.000 sichtbare Marken werden vor der Erzeugung verhindert, indem vollständige feinste Ebenen ausgelassen werden.
- Themenfilter dimmen andere Demo-Ereignisse; Tooltips und Auswahl geben Navigationskontext. Die Minimap zeigt den Ausschnitt und springt per Klick oder Pfeiltasten.
- Der Arbeitsstand wird automatisch in diesem Browser gespeichert. Eine benannte Variante entsteht durch **Speichern**; derselbe Name aktualisiert das betreffende Preset. Änderungen am Arbeitsstand verändern gespeicherte Presets erst durch erneutes Speichern. **Ausgangsstand** bleibt als mitgelieferte Referenz erhalten.
- **A/B vergleichen** zeigt zwei gespeicherte Presets mit gemeinsamem Zeitfenster, Vorschaufläche, Themenfilter und Fokusposition. Eigene Zoom-/Hover-/Gestaltungswerte bleiben erhalten. Der gemeinsame Zoombereich begrenzt die Bedienung; bei fehlender Überschneidung erscheint ein Hinweis. Regler und Exporte beziehen sich weiterhin auf den Arbeitsstand; über **Arbeitsstand** geht es zurück zur Einzelvorschau.
- JSON kann aus einer Datei oder dem Textfeld importiert werden. Ungültige Konfigurationen ersetzen den Arbeitsstand nicht. JSON-/CSS-Exporte stehen im Textfeld und als Download bereit. Erläuterungen: [EXPORT.md](EXPORT.md).

## Grenzen

Die Anwendung arbeitet lokal ohne Backend oder Cloud-Synchronisierung. Browserdaten sind an Browser und Origin gebunden; JSON-Exporte ermöglichen eine unabhängige Sicherung der Konfiguration. Die spätere Anbindung an eine bestehende Timeline ist ein eigener Auftrag.
