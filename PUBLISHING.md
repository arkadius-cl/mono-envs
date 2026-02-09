# Publishing Guide für @micro-devs/mono-envs

## Voraussetzungen

1. **NPM Account** - Stellen Sie sicher, dass Sie ein npm Konto haben
2. **Scope** - Das Package verwendet den Scope `@micro-devs`
3. **Berechtigung** - Sie müssen Zugriff auf den `@micro-devs` Scope haben

## Vorbereitung

### 1. Überprüfen Sie die Konfiguration

```bash
# Prüfen Sie package.json
cat package.json
```

Wichtige Felder:
- ✅ `name`: `@micro-devs/mono-envs`
- ✅ `version`: `1.0.0` (oder höher für Updates)
- ✅ `main`: `dist/index.js`
- ✅ `types`: `dist/index.d.ts`
- ✅ `bin`: CLI-Einstiegspunkt
- ✅ `license`: MIT
- ✅ `publishConfig`: Nicht benötigt für public scope

### 2. Build vorbereiten

```bash
# Bereinigen und neu bauen
npm run clean
npm run build

# Prüfen Sie ob dist/ Ordner erstellt wurde
ls -la dist/
```

### 3. Package-Inhalt prüfen (Dry Run)

```bash
# Zeigt an, was veröffentlicht wird
npm pack --dry-run
```

Erwarteter Inhalt:
- `dist/index.js`
- `dist/index.d.ts`
- `dist/cli/index.js`
- `dist/cli/index.d.ts`
- Alle anderen dist Dateien
- `package.json`
- `README.md` (falls vorhanden)
- `LICENSE` (falls vorhanden)

## Publishing Schritte

### 1. Anmelden bei npm

```bash
# Falls noch nicht angemeldet
npm login
```

Geben Sie Ihre npm Credentials ein.

### 2. Scope auf public setzen (einmalig)

```bash
# Für den @micro-devs Scope public access setzen
npm publish --access public
```

**Wichtig:** Da es ein scoped package (`@micro-devs/...`) ist, müssen Sie `--access public` angeben, um es öffentlich zu machen. Ohne dieses Flag wäre es standardmäßig privat.

### 3. Prerelease testen (optional)

Falls Sie eine Beta-Version testen möchten:

```bash
# Version zu 1.0.0-beta.0 ändern
npm version prerelease --preid beta

# Als prerelease publishen
npm publish --access public --tag beta
```

### 4. Offiziell publishen

```bash
# Erstes Mal oder neuer Release
npm publish --access public
```

## Nach dem Publishing

### 1. Auf npm prüfen

Besuchen Sie: https://www.npmjs.com/package/@micro-devs/mono-envs

### 2. Installation testen

```bash
# In einem neuen Projekt testen
npm install @micro-devs/mono-envs

# CLI testen
npx mono-envs --help
```

## Updates veröffentlichen

### 1. Version erhöhen

```bash
# Patch (1.0.0 -> 1.0.1) für Bugfixes
npm version patch

# Minor (1.0.0 -> 1.1.0) für neue Features (backward compatible)
npm version minor

# Major (1.0.0 -> 2.0.0) für breaking changes
npm version major
```

### 2. Build und Publish

```bash
npm run build
npm publish --access public
```

## NPM Registry konfigurieren

### Standard npm registry

Standardmäßig ist npm.com konfiguriert. Falls nicht:

```bash
npm config set registry https://registry.npmjs.org/
```

### Alternative Registries (optional)

Falls Sie eine private Registry verwenden, können Sie mit `.npmrc` konfigurieren:

```bash
# Nur für @micro-devs Scope eine andere Registry
@micro-devs:registry=https://your-registry.com/
```

## Häufige Probleme

### "You do not have permission to publish"

**Lösung:**
1. Sie sind nicht Mitglied der `@micro-devs` Organisation
2. Kontaktieren Sie den Owner der Organisation oder erstellen Sie den Scope selbst

### "403 Forbidden"

**Lösung:**
```bash
# Anmelden mit korrektem Account
npm logout
npm login
```

### "Package name already exists"

**Lösung:**
- Der Name `@micro-devs/mono-envs` ist bereits vergeben
- Nutzen Sie einen anderen Namen oder kontaktieren Sie den Besitzer

## CI/CD Integration (optional)

### GitHub Actions Beispiel

Erstellen Sie `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Wichtig:** Erstellen Sie ein NPM_TOKEN in Ihren GitHub Repository Secrets:
1. Gehen Sie zu npm Account Settings → Tokens → Create New Token
2. Token "Automation" oder "Publish" auswählen
3. Token zu GitHub Secrets als `NPM_TOKEN` hinzufügen

## Checklist vor dem Publishing

- [ ] Alle Tests bestehen: `npm test`
- [ ] Build erfolgreich: `npm run build`
- [ ] README.md ist vorhanden und aktuell
- [ ] LICENSE Datei ist vorhanden (MIT)
- [ ] package.json ist korrekt (version, main, types, bin)
- [ ] Keine sensiblen Daten im Code
- [ ] Bei npm eingeloggt: `npm whoami`
- [ ] Scope Berechtigung vorhanden
- [ ] Dry Run geprüft: `npm pack --dry-run`

## Nützliche Befehle

```bash
# Aktuell angemeldeter User
npm whoami

# Package Infos anzeigen
npm view @micro-devs/mono-envs

# Version des installierten Packages
npm view @micro-devs/mono-envs version

# Alle verfügbaren Versionen
npm view @micro-devs/mono-envs versions

# Package deinstallieren (für Tests)
npm uninstall @micro-devs/mono-envs

# Lokal packen (tar.gz erstellen)
npm pack
```

## Unterstützung

Bei Problemen:
- npm Docs: https://docs.npmjs.com/
- Scope Org: https://www.npmjs.com/org/micro-devs (falls vorhanden)

---

**Viel Erfolg beim Publishing! 🚀**