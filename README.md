# @micro-devs/mono-envs

Zentrale Verwaltung von Umgebungsvariablen in Monorepos (pnpm/turbo).

## Features

- ✅ Auto-Detection für pnpm und Turborepo
- ✅ Zentrale Konfiguration (JSON/YAML)
- ✅ Automatische App-Erkennung inklusive Convex
- ✅ Env-Var Generator für alle Apps
- ✅ Watch Mode für automatische Synchronisation
- ✅ CLI und API
- ✅ TypeScript Support

## Installation

```bash
npm install @micro-devs/mono-envs --save-dev
```

## Schnellstart

### 1. Initialisierung

```bash
npx @micro-devs/mono-envs init
```

Dies erstellt eine `env.config.json` im Root-Verzeichnis deines Monorepos.

### 2. Konfiguration

Bearbeite `env.config.json`:

```json
{
  "version": "1.0.0",
  "variables": [
    {
      "name": "DATABASE_URL",
      "value": "postgresql://localhost:5432/mydb",
      "apps": ["web-app", "api"],
      "description": "Datenbank-Verbindungsstring",
      "required": true
    },
    {
      "name": "API_KEY",
      "value": "your-secret-key",
      "apps": ["*"],
      "description": "API-Schlüssel für alle Apps"
    },
    {
      "name": "CONVEX_DEPLOYMENT",
      "value": "convex.dev-123abc",
      "apps": ["convex"],
      "description": "Convex Deployment ID"
    }
  ]
}
```

### 3. Apps erkennen

```bash
npx m@micro-devs/mono-envs detect
```

Zeigt alle erkannten Apps im Monorepo an.

### 4. Env-Dateien generieren

```bash
npx @micro-devs/mono-envs generate
```

Generiert `.env`-Dateien für alle konfigurierten Apps.

### 5. Watch Mode

```bash
npx @micro-devs/mono-envs watch
```

Überwacht die Konfigurationsdatei und generiert Env-Dateien bei Änderungen neu.

## CLI Befehle

### `init`
Initialisiere die Konfigurationsdatei.

```bash
@micro-devs/mono-envs init [--format json|yaml]
```

### `detect`
Erkenne die Monorepo-Struktur und liste alle Apps auf.

```bash
@micro-devs/mono-envs detect
```

### `generate`
Generiere .env Dateien für alle Apps.

```bash
@micro-devs/mono-envs generate [options]

Optionen:
  -c, --config <path>    Pfad zur Konfigurationsdatei
  -a, --apps <apps>      Nur für bestimmte Apps (kommagetrennt)
  -d, --dry-run         Nur anzeigen, ohne zu schreiben
  -v, --verbose         Detaillierte Ausgabe
```

### `watch`
Watch Mode für automatische Synchronisation.

```bash
@micro-devs/mono-envs watch [options]

Optionen:
  -c, --config <path>    Pfad zur Konfigurationsdatei
  -d, --debounce <ms>    Debounce Zeit in Millisekunden
  -a, --apps <apps>      Nur für bestimmte Apps (kommagetrennt)
  -v, --verbose          Detaillierte Ausgabe
```

### `validate`
Validiere die Konfiguration.

```bash
@micro-devs/mono-envs validate
```

### `preview`
Vorschau der .env Datei für eine App.

```bash
@micro-devs/mono-envs preview <app-name>
```

## API

```typescript
import { MonorepoEnvManager, ConfigParser } from '@micro-devs/mono-envs';

// Manager initialisieren
const manager = new MonorepoEnvManager();

// Monorepo-Struktur erkennen
const monorepoInfo = manager.detect();

// Alle Apps abrufen
const apps = manager.getApps();

// Konfiguration laden
const config = ConfigParser.load('./env.config.json');

// Env-Dateien generieren
const result = manager.generate(config, { verbose: true });

// Konfiguration validieren
const validation = manager.validate(config);

// Vorschau für eine App
const preview = manager.preview(config, 'web-app');
```

## Konfiguration

### JSON Format

```json
{
  "version": "1.0.0",
  "variables": [
    {
      "name": "VARIABLE_NAME",
      "value": "wert",
      "apps": ["app1", "app2"],
      "description": "Beschreibung",
      "required": false,
      "type": "string",
      "default": "default-wert"
    }
  ]
}
```

### YAML Format

```yaml
version: "1.0.0"
variables:
  - name: VARIABLE_NAME
    value: "wert"
    apps:
      - app1
      - app2
    description: "Beschreibung"
    required: false
    type: string
    default: "default-wert"
```

### Eigenschaften

- `name`: Name der Umgebungsvariable (erforderlich)
- `value`: Wert der Variable (optional)
- `apps`: Array von App-Namen oder `["*"]` für alle Apps (erforderlich)
- `description`: Beschreibung der Variable (optional)
- `required`: Ob die Variable erforderlich ist (optional, default: false)
- `type`: Typ der Variable (optional: string, number, boolean, json)
- `default`: Standardwert (optional)

## App-Typen

Das Tool erkennt automatisch drei Typen von Apps:

- **app**: Web-Apps mit `dev` oder `start` Skript
- **package**: normale Pakete ohne Start-Skript
- **convex**: Convex-Projekte (erkannt am Namen oder Skript)

## License

MIT
