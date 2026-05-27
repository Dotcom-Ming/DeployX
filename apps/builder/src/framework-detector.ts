import * as fs from 'fs';
import * as path from 'path';
import { Framework, FRAMEWORK_CONFIGS } from '@deployx/shared';

export interface DetectedFramework {
  framework: Framework;
  buildCmd: string;
  outputDir: string;
  installCmd: string;
}

export class FrameworkDetector {
  async detectFramework(projectDir: string): Promise<DetectedFramework> {
    const packageJsonPath = path.join(projectDir, 'package.json');
    let packageJson: Record<string, any> = {};
    if (fs.existsSync(packageJsonPath)) {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(content);
    }

    const hasIndexHtml = fs.existsSync(path.join(projectDir, 'index.html'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    let framework: Framework;

    if (deps['next']) framework = Framework.NEXTJS;
    else if (deps['nuxt']) framework = Framework.NUXT;
    else if (deps['vite'] || deps['@vitejs/plugin-react'] || deps['@vitejs/plugin-vue']) framework = Framework.VITE;
    else if (deps['astro']) framework = Framework.ASTRO;
    else if (deps['@remix-run/node'] || deps['remix']) framework = Framework.REMIX;
    else if (hasIndexHtml && Object.keys(deps).length === 0) framework = Framework.STATIC;
    else if (Object.keys(deps).length > 0) framework = Framework.NODE;
    else if (hasIndexHtml) framework = Framework.STATIC;
    else framework = Framework.NODE;

    const config = FRAMEWORK_CONFIGS[framework];
    const scripts = packageJson.scripts || {};
    const buildCmd = scripts['build'] && framework !== Framework.STATIC && framework !== Framework.NODE ? 'npm run build' : config.buildCmd;
    const installCmd = this.detectInstallCmd(projectDir);

    return { framework, buildCmd, outputDir: config.outputDir, installCmd };
  }

  private detectInstallCmd(projectDir: string): string {
    if (fs.existsSync(path.join(projectDir, 'pnpm-lock.yaml'))) return 'pnpm install';
    if (fs.existsSync(path.join(projectDir, 'yarn.lock'))) return 'yarn install';
    return 'npm install';
  }
}
