import * as chokidar from 'chokidar';
import { MonorepoEnvConfig, WatchOptions, GeneratorOptions } from '../types';
import { ConfigParser } from '../config/config-parser';
import { EnvGenerator } from '../generator/env-generator';

export class ConfigWatcher {
  private configPath: string;
  private envGenerator: EnvGenerator;
  private generatorOptions: GeneratorOptions;
  private watcher: chokidar.FSWatcher | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private watchOptions: Required<WatchOptions>;

  constructor(
    configPath: string,
    envGenerator: EnvGenerator,
    generatorOptions: GeneratorOptions = {},
    watchOptions: WatchOptions = {}
  ) {
    this.configPath = configPath;
    this.envGenerator = envGenerator;
    this.generatorOptions = generatorOptions;
    this.watchOptions = {
      debounce: watchOptions.debounce ?? 300,
      onChange: watchOptions.onChange ?? (() => {})
    };
  }

  start(): void {
    if (this.watcher) {
      throw new Error('Watcher is already running');
    }

    console.log(`Watching for changes in ${this.configPath}`);

    this.watcher = chokidar.watch(this.configPath, {
      ignoreInitial: true,
      persistent: true
    });

    this.watcher.on('change', (path) => {
      this.handleConfigChange(path);
    });

    this.watcher.on('error', (error) => {
      console.error('Watcher error:', error);
    });
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('Watcher stopped');
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private handleConfigChange(changedFile: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.regenerate(changedFile);
    }, this.watchOptions.debounce);
  }

  private regenerate(changedFile: string): void {
    try {
      console.log(`Config changed: ${changedFile}`);
      
      const config = ConfigParser.load(this.configPath);
      const result = this.envGenerator.generate(config, this.generatorOptions);

      if (result.success) {
        console.log(`Regenerated .env files for ${result.generated.length} apps`);
        
        if (result.skipped.length > 0 && this.generatorOptions.verbose) {
          console.log(`Skipped ${result.skipped.length} apps`);
        }
      } else {
        console.error('Errors during regeneration:');
        result.errors.forEach(err => {
          console.error(`  - ${err.app}: ${err.error}`);
        });
      }

      this.watchOptions.onChange(changedFile);
    } catch (error) {
      console.error('Failed to regenerate:', error);
    }
  }

  isRunning(): boolean {
    return this.watcher !== null;
  }
}
