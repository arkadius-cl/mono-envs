import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { MonorepoDetector } from '../../src/detection/monorepo-detector';

describe('MonorepoDetector', () => {
  let tempDir: string;
  let monorepoRoot: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'monorepo-test-'));
    monorepoRoot = tempDir;
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const createMockApp = (appName: string, type: 'app' | 'package' = 'app') => {
    const appPath = path.join(tempDir, 'apps', appName);
    fs.mkdirSync(appPath, { recursive: true });

    const packageJson: any = {
      name: `@test/${appName}`,
      version: '1.0.0'
    };

    if (type === 'app') {
      packageJson.scripts = { dev: 'next dev', build: 'next build' };
    }

    fs.writeFileSync(
      path.join(appPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    return appPath;
  };

  const createConvexApp = (appName: string) => {
    const appPath = path.join(tempDir, 'apps', appName);
    fs.mkdirSync(appPath, { recursive: true });

    const packageJson = {
      name: `@test/${appName}`,
      version: '1.0.0',
      scripts: { dev: 'convex dev' }
    };

    fs.writeFileSync(
      path.join(appPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    return appPath;
  };

  describe('constructor and root detection', () => {
    it('should detect pnpm workspace root', () => {
      fs.writeFileSync(path.join(monorepoRoot, 'pnpm-workspace.yaml'), '');
      createMockApp('app1');

      const detector = new MonorepoDetector(monorepoRoot);
      const root = detector.getRoot();

      expect(root).toBe(monorepoRoot);
    });

    it('should detect turbo root', () => {
      fs.writeFileSync(path.join(monorepoRoot, 'turbo.json'), '{}');
      createMockApp('app1');

      const detector = new MonorepoDetector(monorepoRoot);
      const root = detector.getRoot();

      expect(root).toBe(monorepoRoot);
    });

    it('should use current working directory if no monorepo found', () => {
      const detector = new MonorepoDetector(monorepoRoot);
      const root = detector.getRoot();

      expect(root).toBe(monorepoRoot);
    });

    it('should find monorepo root from nested directory', () => {
      fs.writeFileSync(path.join(monorepoRoot, 'pnpm-workspace.yaml'), '');
      createMockApp('app1');

      const nestedDir = path.join(monorepoRoot, 'apps', 'app1');
      const detector = new MonorepoDetector(nestedDir);
      const root = detector.getRoot();

      expect(root).toBe(monorepoRoot);
    });
  });

  describe('detect', () => {
    it('should detect pnpm monorepo type', () => {
      fs.writeFileSync(path.join(monorepoRoot, 'pnpm-workspace.yaml'), '');
      createMockApp('app1');

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.type).toBe('pnpm');
      expect(result.root).toBe(monorepoRoot);
      expect(result.apps).toBeDefined();
      expect(result.configPath).toContain('env.config.json');
    });

    it('should detect turbo monorepo type', () => {
      fs.writeFileSync(path.join(monorepoRoot, 'turbo.json'), '{}');
      createMockApp('app1');

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.type).toBe('turbo');
      expect(result.root).toBe(monorepoRoot);
    });

    it('should detect unknown type if no config found', () => {
      createMockApp('app1');

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.type).toBe('unknown');
    });

    it('should discover apps in workspace', () => {
      fs.writeFileSync(path.join(monorepoRoot, 'pnpm-workspace.yaml'), '');
      createMockApp('app1');
      createMockApp('app2');
      createMockApp('app3');

      const packageJson = {
        name: 'monorepo',
        workspaces: ['apps/*']
      };
      fs.writeFileSync(
        path.join(monorepoRoot, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.apps).toHaveLength(3);
      expect(result.apps.map(app => app.name)).toContain('@test/app1');
      expect(result.apps.map(app => app.name)).toContain('@test/app2');
      expect(result.apps.map(app => app.name)).toContain('@test/app3');
    });

    it('should handle workspace with packages array', () => {
      fs.writeFileSync(path.join(monorepoRoot, 'pnpm-workspace.yaml'), '');
      createMockApp('app1');

      const packageJson = {
        name: 'monorepo',
        workspaces: { packages: ['apps/*'] }
      };
      fs.writeFileSync(
        path.join(monorepoRoot, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.apps).toHaveLength(1);
      expect(result.apps[0].name).toBe('@test/app1');
    });

    it('should return empty apps array if no package.json', () => {
      fs.writeFileSync(path.join(monorepoRoot, 'pnpm-workspace.yaml'), '');

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.apps).toEqual([]);
    });

    it('should return empty apps array if no workspaces defined', () => {
      fs.writeFileSync(path.join(monorepoRoot, 'pnpm-workspace.yaml'), '');

      const packageJson = { name: 'monorepo' };
      fs.writeFileSync(
        path.join(monorepoRoot, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.apps).toEqual([]);
    });
  });

  describe('app type detection', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(monorepoRoot, 'pnpm-workspace.yaml'), '');

      const packageJson = {
        name: 'monorepo',
        workspaces: ['apps/*']
      };
      fs.writeFileSync(
        path.join(monorepoRoot, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
    });

    it('should detect app type for apps with dev/start scripts', () => {
      createMockApp('frontend', 'app');
      createMockApp('backend', 'app');

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.apps[0].type).toBe('app');
      expect(result.apps[1].type).toBe('app');
    });

    it('should detect package type for packages without dev scripts', () => {
      createMockApp('utils', 'package');

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.apps[0].type).toBe('package');
    });

    it('should detect convex type for convex apps', () => {
      createConvexApp('convex-backend');

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.apps[0].type).toBe('convex');
    });

    it('should detect convex type by name containing "convex"', () => {
      const appPath = path.join(tempDir, 'apps', 'my-convex');
      fs.mkdirSync(appPath, { recursive: true });

      const packageJson = {
        name: 'my-convex-app',
        version: '1.0.0'
      };
      fs.writeFileSync(
        path.join(appPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.apps[0].type).toBe('convex');
    });

    it('should include env path for each app', () => {
      createMockApp('frontend', 'app');

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.apps[0].envPath).toContain('.env');
      expect(result.apps[0].envPath).toContain('frontend');
    });

    it('should include correct path for each app', () => {
      createMockApp('frontend', 'app');
      createMockApp('backend', 'app');

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      const frontendApp = result.apps.find(app => app.name === '@test/frontend');
      const backendApp = result.apps.find(app => app.name === '@test/backend');

      expect(frontendApp?.path).toContain('apps');
      expect(frontendApp?.path).toContain('frontend');
      expect(backendApp?.path).toContain('backend');
    });
  });

  describe('edge cases', () => {
    it('should handle app without package.json', () => {
      fs.writeFileSync(path.join(monorepoRoot, 'pnpm-workspace.yaml'), '');

      const appPath = path.join(tempDir, 'apps', 'app1');
      fs.mkdirSync(appPath, { recursive: true });

      const packageJson = {
        name: 'monorepo',
        workspaces: ['apps/*']
      };
      fs.writeFileSync(
        path.join(monorepoRoot, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.apps).toEqual([]);
    });

    it('should handle app with missing name in package.json', () => {
      fs.writeFileSync(path.join(monorepoRoot, 'pnpm-workspace.yaml'), '');

      const appPath = path.join(tempDir, 'apps', 'app1');
      fs.mkdirSync(appPath, { recursive: true });

      const packageJson = {
        version: '1.0.0',
        scripts: { dev: 'next dev' }
      };
      fs.writeFileSync(
        path.join(appPath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const rootPackageJson = {
        name: 'monorepo',
        workspaces: ['apps/*']
      };
      fs.writeFileSync(
        path.join(monorepoRoot, 'package.json'),
        JSON.stringify(rootPackageJson, null, 2)
      );

      const detector = new MonorepoDetector(monorepoRoot);
      const result = detector.detect();

      expect(result.apps).toHaveLength(1);
      expect(result.apps[0].name).toBe('app1');
    });
  });
});