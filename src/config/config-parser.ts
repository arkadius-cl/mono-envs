import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { MonorepoEnvConfig } from '../types';

export class ConfigParser {
  static load(configPath: string): MonorepoEnvConfig {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    const ext = configPath.split('.').pop()?.toLowerCase();
    const content = fs.readFileSync(configPath, 'utf-8');

    switch (ext) {
      case 'json':
        return this.parseJson(content, configPath);
      case 'yaml':
      case 'yml':
        return this.parseYaml(content, configPath);
      default:
        throw new Error(`Unsupported config format: ${ext}`);
    }
  }

  private static parseJson(content: string, configPath: string): MonorepoEnvConfig {
    try {
      const config = JSON.parse(content);
      return this.validate(config);
    } catch (error) {
      throw new Error(`Failed to parse JSON config at ${configPath}: ${error}`);
    }
  }

  private static parseYaml(content: string, configPath: string): MonorepoEnvConfig {
    try {
      const config = yaml.load(content) as any;
      return this.validate(config);
    } catch (error) {
      throw new Error(`Failed to parse YAML config at ${configPath}: ${error}`);
    }
  }

  private static validate(config: any): MonorepoEnvConfig {
    if (!config.version) {
      throw new Error('Config must specify a version');
    }

    if (!Array.isArray(config.variables)) {
      throw new Error('Config must have a variables array');
    }

    for (let i = 0; i < config.variables.length; i++) {
      const variable = config.variables[i];
      
      if (!variable.name) {
        throw new Error(`Variable at index ${i} must have a name`);
      }

      if (!Array.isArray(variable.apps)) {
        throw new Error(`Variable "${variable.name}" must have an apps array`);
      }
    }

    return config as MonorepoEnvConfig;
  }

  static save(config: MonorepoEnvConfig, configPath: string): void {
    const ext = configPath.split('.').pop()?.toLowerCase();
    let content: string;

    switch (ext) {
      case 'json':
        content = JSON.stringify(config, null, 2);
        break;
      case 'yaml':
      case 'yml':
        content = yaml.dump(config, { indent: 2 });
        break;
      default:
        throw new Error(`Unsupported config format: ${ext}`);
    }

    fs.writeFileSync(configPath, content, 'utf-8');
  }

  static createDefault(): MonorepoEnvConfig {
    return {
      version: '1.0.0',
      variables: []
    };
  }
}
