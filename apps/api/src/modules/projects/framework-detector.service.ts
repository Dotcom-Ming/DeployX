import { Injectable, Logger } from '@nestjs/common';
import { Framework } from '@deployx/shared';

export interface FrameworkDetectionResult {
  framework: Framework;
  buildCmd: string;
  outputDir: string;
  installCmd: string;
}

@Injectable()
export class FrameworkDetectorService {
  private readonly logger = new Logger(FrameworkDetectorService.name);

  private readonly frameworkRules: Array<{
    framework: Framework;
    detect: (dependencies: Record<string, string>, devDependencies: Record<string, string>, scripts: Record<string, string>) => boolean;
    buildCmd: string;
    outputDir: string;
    installCmd: string;
  }> = [
    {
      framework: Framework.NEXTJS,
      detect: (deps, devDeps) => 'next' in deps || 'next' in devDeps,
      buildCmd: 'next build',
      outputDir: '.next',
      installCmd: 'npm install',
    },
    {
      framework: Framework.NUXT,
      detect: (deps, devDeps) => 'nuxt' in deps || 'nuxt' in devDeps,
      buildCmd: 'nuxt build',
      outputDir: '.output',
      installCmd: 'npm install',
    },
    {
      framework: Framework.VITE,
      detect: (deps, devDeps) => 'vite' in deps || 'vite' in devDeps,
      buildCmd: 'vite build',
      outputDir: 'dist',
      installCmd: 'npm install',
    },
    {
      framework: Framework.ASTRO,
      detect: (deps, devDeps) => 'astro' in deps || 'astro' in devDeps,
      buildCmd: 'astro build',
      outputDir: 'dist',
      installCmd: 'npm install',
    },
    {
      framework: Framework.REMIX,
      detect: (deps, devDeps) => '@remix-run/node' in deps || '@remix-run/node' in devDeps,
      buildCmd: 'remix build',
      outputDir: 'build',
      installCmd: 'npm install',
    },
  ];

  async detect(repoUrl: string, rootDir: string): Promise<FrameworkDetectionResult> {
    this.logger.log(`Detecting framework for ${repoUrl} (root: ${rootDir})`);

    // In production, this would clone the repo and read package.json
    // For now, return a default based on heuristics or the URL
    const detected = this.detectFromUrl(repoUrl);

    if (detected) {
      return detected;
    }

    return {
      framework: Framework.STATIC,
      buildCmd: 'npm run build',
      outputDir: 'dist',
      installCmd: 'npm install',
    };
  }

  detectFromPackageJson(
    dependencies: Record<string, string>,
    devDependencies: Record<string, string>,
    scripts: Record<string, string>,
  ): FrameworkDetectionResult {
    for (const rule of this.frameworkRules) {
      if (rule.detect(dependencies, devDependencies, scripts)) {
        const buildCmd = scripts?.build || rule.buildCmd;
        return {
          framework: rule.framework,
          buildCmd,
          outputDir: rule.outputDir,
          installCmd: rule.installCmd,
        };
      }
    }

    return {
      framework: Framework.STATIC,
      buildCmd: scripts?.build || 'npm run build',
      outputDir: 'dist',
      installCmd: 'npm install',
    };
  }

  private detectFromUrl(repoUrl: string): FrameworkDetectionResult | null {
    const urlLower = repoUrl.toLowerCase();

    if (urlLower.includes('next') || urlLower.includes('nxt')) {
      return {
        framework: Framework.NEXTJS,
        buildCmd: 'next build',
        outputDir: '.next',
        installCmd: 'npm install',
      };
    }

    if (urlLower.includes('nuxt')) {
      return {
        framework: Framework.NUXT,
        buildCmd: 'nuxt build',
        outputDir: '.output',
        installCmd: 'npm install',
      };
    }

    if (urlLower.includes('vite') || urlLower.includes('vue')) {
      return {
        framework: Framework.VITE,
        buildCmd: 'vite build',
        outputDir: 'dist',
        installCmd: 'npm install',
      };
    }

    if (urlLower.includes('astro')) {
      return {
        framework: Framework.ASTRO,
        buildCmd: 'astro build',
        outputDir: 'dist',
        installCmd: 'npm install',
      };
    }

    return null;
  }
}
