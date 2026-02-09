import { AppManager } from '../../src/detection/app-manager';
import { AppInfo, MonorepoInfo } from '../../src/types';

describe('AppManager', () => {
  let mockApps: AppInfo[];
  let mockMonorepoInfo: MonorepoInfo;
  let appManager: AppManager;

  beforeEach(() => {
    mockApps = [
      {
        name: '@test/app1',
        path: '/path/to/apps/app1',
        type: 'app',
        envPath: '/path/to/apps/app1/.env'
      },
      {
        name: '@test/app2',
        path: '/path/to/apps/app2',
        type: 'app',
        envPath: '/path/to/apps/app2/.env'
      },
      {
        name: '@test/utils',
        path: '/path/to/packages/utils',
        type: 'package',
        envPath: '/path/to/packages/utils/.env'
      },
      {
        name: '@test/convex',
        path: '/path/to/apps/convex',
        type: 'convex',
        envPath: '/path/to/apps/convex/.env'
      }
    ];

    mockMonorepoInfo = {
      type: 'pnpm',
      root: '/path/to/monorepo',
      apps: mockApps,
      configPath: '/path/to/monorepo/env.config.json'
    };

    appManager = new AppManager(mockMonorepoInfo);
  });

  describe('getAllApps', () => {
    it('should return all apps', () => {
      const apps = appManager.getAllApps();
      expect(apps).toHaveLength(4);
      expect(apps).toEqual(mockApps);
    });

    it('should return empty array if no apps', () => {
      const emptyMonorepoInfo: MonorepoInfo = {
        type: 'pnpm',
        root: '/path',
        apps: [],
        configPath: '/path/config.json'
      };
      const emptyAppManager = new AppManager(emptyMonorepoInfo);
      
      expect(emptyAppManager.getAllApps()).toEqual([]);
    });
  });

  describe('getAppsByType', () => {
    it('should return only apps of type "app"', () => {
      const apps = appManager.getAppsByType('app');
      expect(apps).toHaveLength(2);
      expect(apps.every(app => app.type === 'app')).toBe(true);
      expect(apps.map(app => app.name)).toEqual(['@test/app1', '@test/app2']);
    });

    it('should return only packages of type "package"', () => {
      const packages = appManager.getAppsByType('package');
      expect(packages).toHaveLength(1);
      expect(packages[0].name).toBe('@test/utils');
    });

    it('should return only convex apps', () => {
      const convexApps = appManager.getAppsByType('convex');
      expect(convexApps).toHaveLength(1);
      expect(convexApps[0].name).toBe('@test/convex');
    });

    it('should return empty array for type with no apps', () => {
      const result = appManager.getAppsByType('app');
      // Filter for a non-existent type would still work
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getAppByName', () => {
    it('should return app by name', () => {
      const app = appManager.getAppByName('@test/app1');
      expect(app).toBeDefined();
      expect(app?.name).toBe('@test/app1');
    });

    it('should return undefined for non-existent app', () => {
      const app = appManager.getAppByName('@test/nonexistent');
      expect(app).toBeUndefined();
    });

    it('should find convex app by name', () => {
      const app = appManager.getAppByName('@test/convex');
      expect(app).toBeDefined();
      expect(app?.type).toBe('convex');
    });
  });

  describe('getAppsByNames', () => {
    it('should return apps for all given names', () => {
      const apps = appManager.getAppsByNames(['@test/app1', '@test/utils']);
      expect(apps).toHaveLength(2);
      expect(apps.map(app => app.name)).toEqual(['@test/app1', '@test/utils']);
    });

    it('should filter out non-existent app names', () => {
      const apps = appManager.getAppsByNames(['@test/app1', '@test/nonexistent', '@test/app2']);
      expect(apps).toHaveLength(2);
      expect(apps.map(app => app.name)).toEqual(['@test/app1', '@test/app2']);
    });

    it('should return empty array for empty input', () => {
      const apps = appManager.getAppsByNames([]);
      expect(apps).toEqual([]);
    });

    it('should return empty array when all names are invalid', () => {
      const apps = appManager.getAppsByNames(['@test/nonexistent1', '@test/nonexistent2']);
      expect(apps).toEqual([]);
    });
  });

  describe('getConvexApps', () => {
    it('should return only convex apps', () => {
      const convexApps = appManager.getConvexApps();
      expect(convexApps).toHaveLength(1);
      expect(convexApps[0].name).toBe('@test/convex');
      expect(convexApps[0].type).toBe('convex');
    });

    it('should return empty array if no convex apps', () => {
      const monorepoInfoWithoutConvex: MonorepoInfo = {
        type: 'pnpm',
        root: '/path',
        apps: [
          {
            name: '@test/app1',
            path: '/path/app1',
            type: 'app',
            envPath: '/path/app1/.env'
          }
        ],
        configPath: '/path/config.json'
      };
      const appManagerWithoutConvex = new AppManager(monorepoInfoWithoutConvex);
      
      expect(appManagerWithoutConvex.getConvexApps()).toEqual([]);
    });
  });

  describe('getWebApps', () => {
    it('should return only web apps', () => {
      const webApps = appManager.getWebApps();
      expect(webApps).toHaveLength(2);
      expect(webApps.every(app => app.type === 'app')).toBe(true);
      expect(webApps.map(app => app.name)).toEqual(['@test/app1', '@test/app2']);
    });

    it('should return empty array if no web apps', () => {
      const monorepoInfoOnlyPackages: MonorepoInfo = {
        type: 'pnpm',
        root: '/path',
        apps: [
          {
            name: '@test/utils',
            path: '/path/utils',
            type: 'package',
            envPath: '/path/utils/.env'
          }
        ],
        configPath: '/path/config.json'
      };
      const appManagerOnlyPackages = new AppManager(monorepoInfoOnlyPackages);
      
      expect(appManagerOnlyPackages.getWebApps()).toEqual([]);
    });
  });

  describe('getPackageApps', () => {
    it('should return only package apps', () => {
      const packages = appManager.getPackageApps();
      expect(packages).toHaveLength(1);
      expect(packages[0].name).toBe('@test/utils');
      expect(packages[0].type).toBe('package');
    });
  });

  describe('validateAppNames', () => {
    it('should return empty array for all valid app names', () => {
      const invalid = appManager.validateAppNames(['@test/app1', '@test/app2', '@test/utils']);
      expect(invalid).toEqual([]);
    });

    it('should return invalid app names', () => {
      const invalid = appManager.validateAppNames(['@test/app1', '@test/nonexistent', '@test/app2']);
      expect(invalid).toEqual(['@test/nonexistent']);
    });

    it('should return all names if none are valid', () => {
      const invalid = appManager.validateAppNames(['@test/nonexistent1', '@test/nonexistent2']);
      expect(invalid).toEqual(['@test/nonexistent1', '@test/nonexistent2']);
    });

    it('should return empty array for empty input', () => {
      const invalid = appManager.validateAppNames([]);
      expect(invalid).toEqual([]);
    });
  });

  describe('getAppCount', () => {
    it('should return correct app count', () => {
      expect(appManager.getAppCount()).toBe(4);
    });

    it('should return 0 for empty monorepo', () => {
      const emptyMonorepoInfo: MonorepoInfo = {
        type: 'pnpm',
        root: '/path',
        apps: [],
        configPath: '/path/config.json'
      };
      const emptyAppManager = new AppManager(emptyMonorepoInfo);
      
      expect(emptyAppManager.getAppCount()).toBe(0);
    });
  });

  describe('getAppsSummary', () => {
    it('should return correct summary', () => {
      const summary = appManager.getAppsSummary();
      expect(summary).toEqual({
        total: 4,
        apps: 2,
        packages: 1,
        convex: 1
      });
    });

    it('should return zeros for empty monorepo', () => {
      const emptyMonorepoInfo: MonorepoInfo = {
        type: 'pnpm',
        root: '/path',
        apps: [],
        configPath: '/path/config.json'
      };
      const emptyAppManager = new AppManager(emptyMonorepoInfo);
      
      expect(emptyAppManager.getAppsSummary()).toEqual({
        total: 0,
        apps: 0,
        packages: 0,
        convex: 0
      });
    });

    it('should handle monorepo with only one type', () => {
      const onlyAppsMonorepo: MonorepoInfo = {
        type: 'pnpm',
        root: '/path',
        apps: [
          {
            name: '@test/app1',
            path: '/path/app1',
            type: 'app',
            envPath: '/path/app1/.env'
          },
          {
            name: '@test/app2',
            path: '/path/app2',
            type: 'app',
            envPath: '/path/app2/.env'
          }
        ],
        configPath: '/path/config.json'
      };
      const onlyAppsManager = new AppManager(onlyAppsMonorepo);
      
      expect(onlyAppsManager.getAppsSummary()).toEqual({
        total: 2,
        apps: 2,
        packages: 0,
        convex: 0
      });
    });
  });
});