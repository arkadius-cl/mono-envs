#!/usr/bin/env node

import { Command } from 'commander';
import { MonorepoDetector } from '../detection/monorepo-detector';
import { AppManager } from '../detection/app-manager';
import { ConfigParser } from '../config/config-parser';
import { EnvGenerator } from '../generator/env-generator';
import { ConfigWatcher } from '../watch/config-watcher';

const program = new Command();

program
  .name('monorepo-env')
  .description('Zentrale Verwaltung von Umgebungsvariablen in Monorepos')
  .version('0.1.0');

program
  .command('init')
  .description('Initialisiere die Konfigurationsdatei')
  .option('-f, --format <format>', 'Konfigurationsformat (json|yaml)', 'json')
  .action((options) => {
    try {
      const detector = new MonorepoDetector();
      const monorepoInfo = detector.detect();
      const configPath = options.format === 'yaml' 
        ? monorepoInfo.configPath.replace('.json', '.yaml')
        : monorepoInfo.configPath;

      const defaultConfig = ConfigParser.createDefault();
      ConfigParser.save(defaultConfig, configPath);

      console.log(`Konfigurationsdatei erstellt: ${configPath}`);
      console.log('Bearbeite die Datei und füge deine Umgebungsvariablen hinzu.');
    } catch (error) {
      console.error('Fehler:', error);
      process.exit(1);
    }
  });

program
  .command('detect')
  .description('Erkenne die Monorepo-Struktur')
  .action(() => {
    try {
      const detector = new MonorepoDetector();
      const monorepoInfo = detector.detect();
      const appManager = new AppManager(monorepoInfo);

      console.log(`Monorepo Typ: ${monorepoInfo.type}`);
      console.log(`Root: ${monorepoInfo.root}`);
      console.log(`Konfiguration: ${monorepoInfo.configPath}`);
      console.log('');

      const summary = appManager.getAppsSummary();
      console.log(`Apps (${summary.apps}):`);
      appManager.getWebApps().forEach(app => {
        console.log(`  - ${app.name} (${app.path})`);
      });
      console.log('');

      console.log(`Packages (${summary.packages}):`);
      appManager.getPackageApps().forEach(app => {
        console.log(`  - ${app.name} (${app.path})`);
      });
      console.log('');

      console.log(`Convex (${summary.convex}):`);
      appManager.getConvexApps().forEach(app => {
        console.log(`  - ${app.name} (${app.path})`);
      });
      console.log('');

      console.log(`Insgesamt: ${summary.total} Workspace-Pakete`);
    } catch (error) {
      console.error('Fehler:', error);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generiere .env Dateien für alle Apps')
  .option('-c, --config <path>', 'Pfad zur Konfigurationsdatei')
  .option('-a, --apps <apps>', 'Nur für bestimmte Apps (kommagetrennt)')
  .option('-d, --dry-run', 'Nur anzeigen, ohne zu schreiben')
  .option('-v, --verbose', 'Detaillierte Ausgabe')
  .action(async (options) => {
    try {
      const detector = new MonorepoDetector();
      const monorepoInfo = detector.detect();
      const appManager = new AppManager(monorepoInfo);

      const configPath = options.config || monorepoInfo.configPath;
      const config = ConfigParser.load(configPath);

      const generatorOptions: any = {
        dryRun: options.dryRun,
        verbose: options.verbose
      };

      if (options.apps) {
        generatorOptions.filterApps = options.apps.split(',').map((s: string) => s.trim());
      }

      const envGenerator = new EnvGenerator(appManager);
      const result = envGenerator.generate(config, generatorOptions);

      if (result.success) {
        console.log(`✓ Erfolgreich generiert für ${result.generated.length} Apps:`);
        result.generated.forEach(app => console.log(`  - ${app}`));

        if (result.skipped.length > 0) {
          console.log(`\nÜbersprungen (${result.skipped.length}):`);
          result.skipped.forEach(app => console.log(`  - ${app}`));
        }
      } else {
        console.error('✗ Fehler bei der Generierung:');
        result.errors.forEach(err => {
          console.error(`  - ${err.app}: ${err.error}`);
        });
        process.exit(1);
      }
    } catch (error) {
      console.error('Fehler:', error);
      process.exit(1);
    }
  });

program
  .command('watch')
  .description('Watch Mode: Generiere .env Dateien bei Konfigurationsänderungen')
  .option('-c, --config <path>', 'Pfad zur Konfigurationsdatei')
  .option('-d, --debounce <ms>', 'Debounce Zeit in Millisekunden', '300')
  .option('-a, --apps <apps>', 'Nur für bestimmte Apps (kommagetrennt)')
  .option('-v, --verbose', 'Detaillierte Ausgabe')
  .action((options) => {
    try {
      const detector = new MonorepoDetector();
      const monorepoInfo = detector.detect();
      const appManager = new AppManager(monorepoInfo);

      const configPath = options.config || monorepoInfo.configPath;
      const config = ConfigParser.load(configPath);

      const generatorOptions: any = {
        verbose: options.verbose
      };

      if (options.apps) {
        generatorOptions.filterApps = options.apps.split(',').map((s: string) => s.trim());
      }

      const envGenerator = new EnvGenerator(appManager);
      const watcher = new ConfigWatcher(
        configPath,
        envGenerator,
        generatorOptions,
        { debounce: parseInt(options.debounce) }
      );

      watcher.start();

      process.on('SIGINT', () => {
        watcher.stop();
        process.exit(0);
      });
    } catch (error) {
      console.error('Fehler:', error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validiere die Konfiguration')
  .option('-c, --config <path>', 'Pfad zur Konfigurationsdatei')
  .action((options) => {
    try {
      const detector = new MonorepoDetector();
      const monorepoInfo = detector.detect();
      const appManager = new AppManager(monorepoInfo);

      const configPath = options.config || monorepoInfo.configPath;
      const config = ConfigParser.load(configPath);

      const envGenerator = new EnvGenerator(appManager);
      const validation = envGenerator.validateConfig(config);

      if (validation.valid) {
        console.log('✓ Konfiguration ist gültig');
      } else {
        console.error('✗ Konfigurationsfehler:');
        validation.errors.forEach(error => {
          console.error(`  - ${error}`);
        });
        process.exit(1);
      }
    } catch (error) {
      console.error('Fehler:', error);
      process.exit(1);
    }
  });

program
  .command('preview')
  .description('Vorschau der .env Datei für eine App')
  .argument('<app>', 'App Name')
  .option('-c, --config <path>', 'Pfad zur Konfigurationsdatei')
  .action((app, options) => {
    try {
      const detector = new MonorepoDetector();
      const monorepoInfo = detector.detect();
      const appManager = new AppManager(monorepoInfo);

      const configPath = options.config || monorepoInfo.configPath;
      const config = ConfigParser.load(configPath);

      const envGenerator = new EnvGenerator(appManager);
      const preview = envGenerator.preview(config, app);

      console.log(preview);
    } catch (error) {
      console.error('Fehler:', error);
      process.exit(1);
    }
  });

program.parse();
