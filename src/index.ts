import { MonorepoDetector } from './detection/monorepo-detector';
import { AppManager } from './detection/app-manager';
import { ConfigParser } from './config/config-parser';
import { EnvGenerator, GenerateResult } from './generator/env-generator';
import { ConfigWatcher } from './watch/config-watcher';

export type {
  MonorepoEnvConfig,
  EnvVariable,
  AppInfo,
  MonorepoInfo,
  GeneratorOptions,
  WatchOptions
} from './types';

export { MonorepoDetector, AppManager, ConfigParser, EnvGenerator, GenerateResult, ConfigWatcher };

export class MonorepoEnvManager {
  private detector: MonorepoDetector;
  private appManager: AppManager;
  private envGenerator: EnvGenerator;

  constructor(startPath?: string) {
    this.detector = new MonorepoDetector(startPath);
    const monorepoInfo = this.detector.detect();
    this.appManager = new AppManager(monorepoInfo);
    this.envGenerator = new EnvGenerator(this.appManager);
  }

  detect() {
    return this.detector.detect();
  }

  getApps() {
    return this.appManager.getAllApps();
  }

  generate(config: any, options?: any) {
    return this.envGenerator.generate(config, options);
  }

  validate(config: any) {
    return this.envGenerator.validateConfig(config);
  }

  preview(config: any, appName: string) {
    return this.envGenerator.preview(config, appName);
  }
}
