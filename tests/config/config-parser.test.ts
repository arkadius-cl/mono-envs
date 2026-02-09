import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigParser } from '../../src/config/config-parser';

describe('ConfigParser', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('load', () => {
    it('should load a valid JSON config', () => {
      const configPath = path.join(tempDir, 'config.json');
      const validConfig = {
        version: '1.0.0',
        variables: [
          {
            name: 'API_KEY',
            value: 'test-key',
            apps: ['app1', 'app2']
          }
        ]
      };
      fs.writeFileSync(configPath, JSON.stringify(validConfig, null, 2));

      const result = ConfigParser.load(configPath);
      expect(result.version).toBe('1.0.0');
      expect(result.variables).toHaveLength(1);
      expect(result.variables[0].name).toBe('API_KEY');
    });

    it('should load a valid YAML config', () => {
      const configPath = path.join(tempDir, 'config.yaml');
      const yamlContent = `
version: "1.0.0"
variables:
  - name: API_KEY
    value: test-key
    apps:
      - app1
      - app2
`;
      fs.writeFileSync(configPath, yamlContent);

      const result = ConfigParser.load(configPath);
      expect(result.version).toBe('1.0.0');
      expect(result.variables).toHaveLength(1);
      expect(result.variables[0].name).toBe('API_KEY');
    });

    it('should throw error if config file does not exist', () => {
      const configPath = path.join(tempDir, 'nonexistent.json');
      expect(() => ConfigParser.load(configPath)).toThrow('Config file not found');
    });

    it('should throw error for invalid JSON', () => {
      const configPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(configPath, '{ invalid json }');

      expect(() => ConfigParser.load(configPath)).toThrow('Failed to parse JSON config');
    });

    it('should throw error for unsupported format', () => {
      const configPath = path.join(tempDir, 'config.txt');
      fs.writeFileSync(configPath, 'some content');

      expect(() => ConfigParser.load(configPath)).toThrow('Unsupported config format');
    });

    it('should throw error if version is missing', () => {
      const configPath = path.join(tempDir, 'config.json');
      const invalidConfig = {
        variables: [
          {
            name: 'API_KEY',
            apps: ['app1']
          }
        ]
      };
      fs.writeFileSync(configPath, JSON.stringify(invalidConfig));

      expect(() => ConfigParser.load(configPath)).toThrow('Config must specify a version');
    });

    it('should throw error if variables array is missing', () => {
      const configPath = path.join(tempDir, 'config.json');
      const invalidConfig = {
        version: '1.0.0'
      };
      fs.writeFileSync(configPath, JSON.stringify(invalidConfig));

      expect(() => ConfigParser.load(configPath)).toThrow('Config must have a variables array');
    });

    it('should throw error if variable name is missing', () => {
      const configPath = path.join(tempDir, 'config.json');
      const invalidConfig = {
        version: '1.0.0',
        variables: [
          {
            value: 'test',
            apps: ['app1']
          }
        ]
      };
      fs.writeFileSync(configPath, JSON.stringify(invalidConfig));

      expect(() => ConfigParser.load(configPath)).toThrow('Variable at index 0 must have a name');
    });

    it('should throw error if variable apps array is missing', () => {
      const configPath = path.join(tempDir, 'config.json');
      const invalidConfig = {
        version: '1.0.0',
        variables: [
          {
            name: 'API_KEY',
            value: 'test'
          }
        ]
      };
      fs.writeFileSync(configPath, JSON.stringify(invalidConfig));

      expect(() => ConfigParser.load(configPath)).toThrow('Variable "API_KEY" must have an apps array');
    });
  });

  describe('save', () => {
    it('should save config as JSON', () => {
      const configPath = path.join(tempDir, 'config.json');
      const config = {
        version: '1.0.0',
        variables: [
          {
            name: 'API_KEY',
            value: 'test-key',
            apps: ['app1']
          }
        ]
      };

      ConfigParser.save(config, configPath);
      expect(fs.existsSync(configPath)).toBe(true);

      const content = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.variables).toHaveLength(1);
    });

    it('should save config as YAML', () => {
      const configPath = path.join(tempDir, 'config.yaml');
      const config = {
        version: '1.0.0',
        variables: [
          {
            name: 'API_KEY',
            value: 'test-key',
            apps: ['app1']
          }
        ]
      };

      ConfigParser.save(config, configPath);
      expect(fs.existsSync(configPath)).toBe(true);

      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('version: 1.0.0');
      expect(content).toContain('API_KEY');
    });

    it('should throw error for unsupported format when saving', () => {
      const configPath = path.join(tempDir, 'config.txt');
      const config = {
        version: '1.0.0',
        variables: []
      };

      expect(() => ConfigParser.save(config, configPath)).toThrow('Unsupported config format');
    });
  });

  describe('createDefault', () => {
    it('should create a default config structure', () => {
      const config = ConfigParser.createDefault();
      expect(config.version).toBe('1.0.0');
      expect(config.variables).toEqual([]);
      expect(Array.isArray(config.variables)).toBe(true);
    });
  });
});