import * as fs from 'fs';
import * as path from 'path';
import { MonorepoInfo, AppInfo } from '../types';

export class MonorepoDetector {
  private root: string;

  constructor(startPath: string = process.cwd()) {
    this.root = this.findMonorepoRoot(startPath);
  }

  private findMonorepoRoot(startPath: string): string {
    let current = startPath;
    
    while (current !== path.parse(current).root) {
      const pnpmWorkspace = path.join(current, 'pnpm-workspace.yaml');
      const turboJson = path.join(current, 'turbo.json');
      
      if (fs.existsSync(pnpmWorkspace) || fs.existsSync(turboJson)) {
        return current;
      }
      
      current = path.dirname(current);
    }
    
    return startPath;
  }

  detect(): MonorepoInfo {
    const pnpmWorkspace = path.join(this.root, 'pnpm-workspace.yaml');
    const turboJson = path.join(this.root, 'turbo.json');
    const packageJsonPath = path.join(this.root, 'package.json');
    
    let type: 'pnpm' | 'turbo' | 'unknown' = 'unknown';
    
    if (fs.existsSync(pnpmWorkspace)) {
      type = 'pnpm';
    } else if (fs.existsSync(turboJson)) {
      type = 'turbo';
    }
    
    const apps = this.discoverApps(packageJsonPath);
    const configPath = path.join(this.root, 'env.config.json');
    
    return {
      type,
      root: this.root,
      apps,
      configPath
    };
  }

  private discoverApps(packageJsonPath: string): AppInfo[] {
    const apps: AppInfo[] = [];
    
    if (!fs.existsSync(packageJsonPath)) {
      return apps;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const workspaces = packageJson.workspaces;
    
    if (!workspaces) {
      return apps;
    }
    
    const patterns = Array.isArray(workspaces) ? workspaces : workspaces.packages || [];
    
    for (const pattern of patterns) {
      const globPattern = pattern.replace(/\/\*$/, '');
      const dirs = this.findMatchingDirs(this.root, globPattern);
      
      for (const dir of dirs) {
        const appInfo = this.analyzeApp(dir);
        if (appInfo) {
          apps.push(appInfo);
        }
      }
    }
    
    return apps;
  }

  private findMatchingDirs(root: string, pattern: string): string[] {
    const dirs: string[] = [];
    const targetDir = path.join(root, pattern);
    
    if (fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
      const entries = fs.readdirSync(targetDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          dirs.push(path.join(targetDir, entry.name));
        }
      }
    }
    
    return dirs;
  }

  private analyzeApp(appPath: string): AppInfo | null {
    const packageJsonPath = path.join(appPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const name = packageJson.name || path.basename(appPath);
    
    let type: 'app' | 'package' | 'convex' = 'package';
    
    if (name.includes('convex') || packageJson.scripts?.dev?.includes('convex')) {
      type = 'convex';
    } else if (packageJson.scripts?.dev || packageJson.scripts?.start) {
      type = 'app';
    }
    
    const envPath = path.join(appPath, '.env');
    
    return {
      name,
      path: appPath,
      type,
      envPath
    };
  }

  getRoot(): string {
    return this.root;
  }
}
