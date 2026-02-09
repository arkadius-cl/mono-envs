import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { vi } from 'vitest';
import { ConfigWatcher } from '../../src/watch/config-watcher';
import { EnvGenerator } from '../../src/generator/env-generator';
import { AppManager } from '../../src/detection/app-manager';
import { ConfigParser } from '../../src/config/config-parser';
import { AppInfo, MonorepoInfo } from '../../src/types';

describe('ConfigWatcher', () => {
  let tempDir: string;
  let configPath: string;
  let mockApps: AppInfo[];
  let mockMonorepoInfo: MonorepoInfo;
  let appManager: AppManager;
  let envGenerator: EnvGenerator;
  let configWatcher: ConfigWatcher;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watcher-test-'));
    configPath = path.join(tempDir, 'env.config.json');

    mockApps = [
      {
        name: '@test/app1',
        path: path.join(tempDir, 'apps/app1'),
        type: 'app',
        envPath: path.join(tempDir, 'apps/app1/.env')
      }
    ];

    mockMonorepoInfo = {
      type: 'pnpm',
      root: tempDir,
      apps: mockApps,
      configPath: configPath
    };

    appManager = new AppManager(mockMonorepoInfo);
    envGenerator = new EnvGenerator(appManager);

    // Create app directory
    fs.mkdirSync(mockApps[0].path, { recursive: true });

    // Create initial config
    const initialConfig = {
      version: '1.0.0',
      variables: [
        {
          name: 'API_KEY',
          value: 'initial-value',
          apps: ['@test/app1']
        }
      ]
    };
    ConfigParser.save(initialConfig, configPath);
  });

  afterEach(() => {
    if (configWatcher && configWatcher.isRunning()) {
      configWatcher.stop();
    }

    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const watcher = new ConfigWatcher(configPath, envGenerator);
      expect(watcher.isRunning()).toBe(false);
    });

    it('should initialize with custom debounce', () => {
      const watcher = new ConfigWatcher(configPath, envGenerator, {}, { debounce: 500 });
      expect(watcher.isRunning()).toBe(false);
    });

    it('should initialize with custom onChange callback', () => {
      const onChange = vi.fn();
      const watcher = new ConfigWatcher(configPath, envGenerator, {}, { onChange });
      expect(watcher.isRunning()).toBe(false);
    });
  });

  describe('start', () => {
    it('should start the watcher', () => {
      configWatcher = new ConfigWatcher(configPath, envGenerator);
      configWatcher.start();
      expect(configWatcher.isRunning()).toBe(true);
      configWatcher.stop();
    });

    it('should throw error if watcher is already running', () => {
      configWatcher = new ConfigWatcher(configPath, envGenerator);
      configWatcher.start();
      
      expect(() => configWatcher.start()).toThrow('Watcher is already running');
      configWatcher.stop();
    });

    it('should log watching message', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      configWatcher = new ConfigWatcher(configPath, envGenerator);
      configWatcher.start();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Watching for changes'));
      consoleSpy.mockRestore();
      configWatcher.stop();
    });
  });

  describe('stop', () => {
    it('should stop the watcher', () => {
      configWatcher = new ConfigWatcher(configPath, envGenerator);
      configWatcher.start();
      expect(configWatcher.isRunning()).toBe(true);
      
      configWatcher.stop();
      expect(configWatcher.isRunning()).toBe(false);
    });

    it('should log stop message', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      configWatcher = new ConfigWatcher(configPath, envGenerator);
      configWatcher.start();
      configWatcher.stop();
      
      expect(consoleSpy).toHaveBeenCalledWith('Watcher stopped');
      consoleSpy.mockRestore();
    });

    it('should not throw error if watcher is not running', () => {
      configWatcher = new ConfigWatcher(configPath, envGenerator);
      expect(() => configWatcher.stop()).not.toThrow();
    });
  });

  describe('isRunning', () => {
    it('should return false when not started', () => {
      configWatcher = new ConfigWatcher(configPath, envGenerator);
      expect(configWatcher.isRunning()).toBe(false);
    });

    it('should return true when running', () => {
      configWatcher = new ConfigWatcher(configPath, envGenerator);
      configWatcher.start();
      expect(configWatcher.isRunning()).toBe(true);
      configWatcher.stop();
    });

    it('should return false after stop', () => {
      configWatcher = new ConfigWatcher(configPath, envGenerator);
      configWatcher.start();
      configWatcher.stop();
      expect(configWatcher.isRunning()).toBe(false);
    });
  });

  describe('config change handling', () => {
    it('should regenerate env files when config changes', async () => {
      const onChange = vi.fn();
      configWatcher = new ConfigWatcher(configPath, envGenerator, {}, { onChange, debounce: 100 });
      configWatcher.start();

      // Wait a bit for watcher to be ready
      await new Promise(resolve => setTimeout(resolve, 200));

      // Update config
      const updatedConfig = {
        version: '1.0.0',
        variables: [
          {
            name: 'API_KEY',
            value: 'updated-value',
            apps: ['@test/app1']
          }
        ]
      };
      ConfigParser.save(updatedConfig, configPath);

      // Wait for debounce and file system events
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(fs.existsSync(mockApps[0].envPath)).toBe(true);
      const envContent = fs.readFileSync(mockApps[0].envPath, 'utf-8');
      expect(envContent).toContain('API_KEY=updated-value');
      expect(onChange).toHaveBeenCalled();

      configWatcher.stop();
    });

    it('should call onChange callback when config changes', async () => {
      const onChange = vi.fn();
      configWatcher = new ConfigWatcher(configPath, envGenerator, {}, { onChange, debounce: 100 });
      configWatcher.start();

      await new Promise(resolve => setTimeout(resolve, 200));

      const updatedConfig = {
        version: '1.0.0',
        variables: [
          {
            name: 'NEW_VAR',
            value: 'test',
            apps: ['@test/app1']
          }
        ]
      };
      ConfigParser.save(updatedConfig, configPath);

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(onChange).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith(configPath);

      configWatcher.stop();
    });

    it('should handle debounce correctly', async () => {
      const onChange = vi.fn();
      configWatcher = new ConfigWatcher(configPath, envGenerator, {}, { onChange, debounce: 200 });
      configWatcher.start();

      await new Promise(resolve => setTimeout(resolve, 200));

      // Make multiple quick changes
      for (let i = 0; i < 3; i++) {
        const config = {
          version: '1.0.0',
          variables: [
            {
              name: `VAR_${i}`,
              value: `value-${i}`,
              apps: ['@test/app1']
            }
          ]
        };
        ConfigParser.save(config, configPath);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 400));

      // Should have been called fewer times than the number of changes due to debounce
      expect(onChange.mock.calls.length).toBeLessThan(3);

      configWatcher.stop();
    });

    it('should log regeneration success', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      configWatcher = new ConfigWatcher(configPath, envGenerator, { verbose: true }, { debounce: 100 });
      configWatcher.start();

      await new Promise(resolve => setTimeout(resolve, 200));

      const updatedConfig = {
        version: '1.0.0',
        variables: [
          {
            name: 'NEW_VAR',
            value: 'test',
            apps: ['@test/app1']
          }
        ]
      };
      ConfigParser.save(updatedConfig, configPath);

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Regenerated .env files'));
      consoleSpy.mockRestore();
      configWatcher.stop();
    });

    it('should log errors during regeneration', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create invalid config
      const invalidConfigPath = path.join(tempDir, 'invalid-config.json');
      fs.writeFileSync(invalidConfigPath, '{ invalid json }');

      configWatcher = new ConfigWatcher(invalidConfigPath, envGenerator, {}, { debounce: 100 });
      configWatcher.start();

      await new Promise(resolve => setTimeout(resolve, 200));

      // Try to write invalid content
      fs.writeFileSync(invalidConfigPath, '{ still invalid }');

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
      configWatcher.stop();
    });
  });

  describe('dry run mode', () => {
    it('should skip file writing in dry run mode', async () => {
      const onChange = vi.fn();
      configWatcher = new ConfigWatcher(
        configPath,
        envGenerator,
        { dryRun: true, verbose: true },
        { onChange, debounce: 100 }
      );
      configWatcher.start();

      await new Promise(resolve => setTimeout(resolve, 200));

      const updatedConfig = {
        version: '1.0.0',
        variables: [
          {
            name: 'NEW_VAR',
            value: 'test',
            apps: ['@test/app1']
          }
        ]
      };
      ConfigParser.save(updatedConfig, configPath);

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(fs.existsSync(mockApps[0].envPath)).toBe(false);
      expect(onChange).toHaveBeenCalled();

      configWatcher.stop();
    });
  });

  describe('error handling', () => {
    it('should handle watcher errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      configWatcher = new ConfigWatcher(configPath, envGenerator, {}, { debounce: 100 });
      configWatcher.start();

      await new Promise(resolve => setTimeout(resolve, 200));

      // Simulate error by writing invalid config
      fs.writeFileSync(configPath, '{ invalid json }');

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
      configWatcher.stop();
    });
  });
});