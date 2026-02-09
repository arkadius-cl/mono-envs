import { AppInfo, MonorepoInfo } from '../types';

export class AppManager {
  private monorepoInfo: MonorepoInfo;

  constructor(monorepoInfo: MonorepoInfo) {
    this.monorepoInfo = monorepoInfo;
  }

  getAllApps(): AppInfo[] {
    return this.monorepoInfo.apps;
  }

  getAppsByType(type: 'app' | 'package' | 'convex'): AppInfo[] {
    return this.monorepoInfo.apps.filter(app => app.type === type);
  }

  getAppByName(name: string): AppInfo | undefined {
    return this.monorepoInfo.apps.find(app => app.name === name);
  }

  getAppsByNames(names: string[]): AppInfo[] {
    return names
      .map(name => this.getAppByName(name))
      .filter((app): app is AppInfo => app !== undefined);
  }

  getConvexApps(): AppInfo[] {
    return this.getAppsByType('convex');
  }

  getWebApps(): AppInfo[] {
    return this.getAppsByType('app');
  }

  getPackageApps(): AppInfo[] {
    return this.getAppsByType('package');
  }

  validateAppNames(names: string[]): string[] {
    const validNames = new Set(this.monorepoInfo.apps.map(app => app.name));
    return names.filter(name => !validNames.has(name));
  }

  getAppCount(): number {
    return this.monorepoInfo.apps.length;
  }

  getAppsSummary(): { total: number; apps: number; packages: number; convex: number } {
    return {
      total: this.monorepoInfo.apps.length,
      apps: this.getAppsByType('app').length,
      packages: this.getAppsByType('package').length,
      convex: this.getAppsByType('convex').length
    };
  }
}
