export interface MonorepoEnvConfig {
  $schema?: string;
  version: string;
  variables: EnvVariable[];
}

export interface EnvVariable {
  name: string;
  value?: string;
  apps: string[];
  description?: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'json';
  default?: string | number | boolean;
}

export interface AppInfo {
  name: string;
  path: string;
  type: 'app' | 'package' | 'convex';
  envPath: string;
}

export interface MonorepoInfo {
  type: 'pnpm' | 'turbo' | 'unknown';
  root: string;
  apps: AppInfo[];
  configPath: string;
}

export interface GeneratorOptions {
  dryRun?: boolean;
  verbose?: boolean;
  filterApps?: string[];
}

export interface WatchOptions {
  debounce?: number;
  onChange?: (changedFile: string) => void;
}
