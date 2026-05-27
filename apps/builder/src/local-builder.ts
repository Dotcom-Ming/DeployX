import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { simpleGit } from 'simple-git';

export class LocalBuilder {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = process.env.BUILDER_TEMP_DIR || path.join(os.tmpdir(), 'deployx-builds');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async cloneRepo(repoUrl: string, branch: string, commitSha?: string): Promise<string> {
    const projectDir = path.join(this.tempDir, `build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    const git = simpleGit();
    await git.clone(repoUrl, projectDir, ['--branch', branch, '--depth', '50']);
    if (commitSha) {
      const repoGit = simpleGit(projectDir);
      await repoGit.checkout(commitSha);
    }
    return projectDir;
  }

  async installDependencies(projectDir: string, installCmd: string, onLog: (line: string) => void): Promise<void> {
    const [command, ...args] = installCmd.split(' ');
    await this.executeCommand(projectDir, command, args, onLog);
  }

  async executeBuild(projectDir: string, buildCmd: string, onLog: (line: string) => void): Promise<void> {
    const [command, ...args] = buildCmd.split(' ');
    await this.executeCommand(projectDir, command, args, onLog);
  }

  private executeCommand(cwd: string, command: string, args: string[], onLog: (line: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const child: ChildProcess = spawn(command, args, {
        cwd, shell: true,
        env: { ...process.env, NODE_ENV: 'production', CI: 'true' },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      child.stdout?.on('data', (data: Buffer) => {
        data.toString().split('\n').filter(Boolean).forEach((line) => onLog(line));
      });
      child.stderr?.on('data', (data: Buffer) => {
        data.toString().split('\n').filter(Boolean).forEach((line) => onLog(`[stderr] ${line}`));
      });
      child.on('close', (code: number | null) => {
        if (code === 0) resolve();
        else reject(new Error(`Command "${command} ${args.join(' ')}" exited with code ${code}`));
      });
      child.on('error', (err: Error) => reject(new Error(`Failed to execute command: ${err.message}`)));
    });
  }

  async cleanup(projectDir: string): Promise<void> {
    try {
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
      }
    } catch {}
  }
}
