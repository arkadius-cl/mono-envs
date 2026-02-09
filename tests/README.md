# Test-Dokumentation

Dieses Verzeichnis enthält umfassende Unit-Tests für alle Komponenten des Monorepo Env Managers.

## Test-Struktur

```
tests/
├── config/
│   └── config-parser.test.ts    # Tests für ConfigParser (JSON/YAML)
├── detection/
│   ├── monorepo-detector.test.ts # Tests für Monorepo-Detektor
│   └── app-manager.test.ts       # Tests für App-Manager
├── generator/
│   └── env-generator.test.ts     # Tests für Umgebungs-Generator
└── watch/
    └── config-watcher.test.ts     # Tests für Config-Watcher
```

## Test-Statistik

- **Gesamte Tests**: 96
- **Bestanden**: 96 (100%)
- **Fehlgeschlagen**: 0

## Test-Kategorien

### 1. ConfigParser Tests (10 Tests)
- Laden von JSON- und YAML-Konfigurationen
- Validierung von Konfigurationsstrukturen
- Speichern von Konfigurationen
- Fehlerbehandlung bei ungültigen Formaten
- Erstellung von Standardkonfigurationen

### 2. MonorepoDetector Tests (20 Tests)
- Erkennung von pnpm- und turbo-workspaces
- Discovery von Apps im Monorepo
- Typ-Erkennung (app, package, convex)
- Pfad-Auflösung
- Edge Cases und Fehlerbehandlung

### 3. AppManager Tests (14 Tests)
- Abrufen aller Apps
- Filtern nach Typ
- Suche nach Namen
- Validierung von App-Namen
- Zusammenfassung der App-Statistiken

### 4. EnvGenerator Tests (17 Tests)
- Generierung von .env-Dateien
- Wildcard-Unterstützung (*)
- Default-Werte und required-Variablen
- Validierung von Konfigurationen
- Preview-Funktionalität
- Dry-Run-Modus

### 5. ConfigWatcher Tests (13 Tests)
- Start/Stop des Watchers
- Debounce-Verhalten
- Callback bei Änderungen
- Fehlerbehandlung
- Automatische Regenerierung

## Test ausführen

### Alle Tests ausführen
```bash
npm test
```

### Tests im Watch-Modus
```bash
npm run test:watch
```

### Coverage-Report erstellen
```bash
npm run test:coverage
```

### Spezifische Test-Datei
```bash
npm test -- tests/config/config-parser.test.ts
```

## Test-Best Practices

1. **Isolation**: Jeder Test erstellt temporäre Verzeichnisse und bereinigt sie danach
2. **Mocking**: Dateisystem-Operationen werden gemockt, wenn nötig
3. **Async/await**: Asynchrone Tests werden korrekt gehandhabt
4. **Edge Cases**: Szenarien mit ungültigen Eingaben werden getestet
5. **Error Handling**: Fehlerzustände werden explizit getestet

## Test-Coverage

Die Tests decken folgende Aspekte ab:
- ✅ Happy Path (normale Funktionsweise)
- ✅ Error Cases (Fehlerbehandlung)
- ✅ Edge Cases (Grenzfälle)
- ✅ Integration zwischen Komponenten
- ✅ Validierung von Eingaben
- ✅ File-System-Operationen

## Continuous Integration

Die Tests sollten in CI/CD-Pipelines ausgeführt werden:

```yaml
# Beispiel für GitHub Actions
- name: Run tests
  run: npm test
```

## Troubleshooting

### Langsame Tests
Einige Tests (insbesondere ConfigWatcher) benötigen Zeit für Dateisystem-Events. Dies ist normal und erwartet.

### Temporäre Dateien
Alle temporären Dateien werden in `os.tmpdir()` erstellt und nach jedem Test bereinigt.

### TypeScript-Fehler
Stellen Sie sicher, dass das Projekt vor den Tests kompiliert wurde:
```bash
npm run build
npm test