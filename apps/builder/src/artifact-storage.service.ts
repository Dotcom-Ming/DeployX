import * as fs from 'fs';
import * as path from 'path';

export interface StorageConfig {
  endpoint: string;
  port?: number;
  accessKey: string;
  secretKey: string;
  bucket: string;
  useSSL?: boolean;
  region?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  etag?: string;
}

export class ArtifactStorageService {
  private config: StorageConfig;

  constructor() {
    this.config = {
      endpoint: process.env.MINIO_ENDPOINT || process.env.S3_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || process.env.S3_PORT || '9000', 10),
      accessKey: process.env.MINIO_ACCESS_KEY || process.env.S3_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || process.env.S3_SECRET_KEY || '',
      bucket: process.env.MINIO_BUCKET || process.env.S3_BUCKET || 'deployx-builds',
      useSSL: process.env.MINIO_USE_SSL === 'true' || process.env.S3_USE_SSL === 'true',
      region: process.env.MINIO_REGION || process.env.S3_REGION || 'us-east-1',
    };
  }

  get isConfigured(): boolean {
    return !!(this.config.accessKey && this.config.secretKey);
  }

  private getBaseUrl(): string {
    const protocol = this.config.useSSL ? 'https' : 'http';
    const port = this.config.port ? `:${this.config.port}` : '';
    return `${protocol}://${this.config.endpoint}${port}`;
  }

  async ensureBucket(): Promise<void> {
    if (!this.isConfigured) return;

    const url = `${this.getBaseUrl()}/${this.config.bucket}`;

    const response = await fetch(url, {
      method: 'HEAD',
      headers: this.getAuthHeaders('HEAD', `/${this.config.bucket}`),
    });

    if (response.status === 404) {
      await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders('PUT', `/${this.config.bucket}`),
      });
    }
  }

  async uploadBuildArtifact(
    projectId: string,
    deploymentId: string,
    artifactPath: string,
  ): Promise<UploadResult | null> {
    if (!this.isConfigured) {
      console.warn('Artifact storage not configured, skipping upload');
      return null;
    }

    const key = `builds/${projectId}/${deploymentId}/${path.basename(artifactPath)}`;

    if (!fs.existsSync(artifactPath)) {
      console.warn(`Artifact path does not exist: ${artifactPath}`);
      return null;
    }

    const stat = fs.statSync(artifactPath);

    if (stat.isDirectory()) {
      return this.uploadDirectory(projectId, deploymentId, artifactPath);
    }

    const fileBuffer = fs.readFileSync(artifactPath);
    const url = `${this.getBaseUrl()}/${this.config.bucket}/${key}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders('PUT', `/${this.config.bucket}/${key}`),
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(fileBuffer.length),
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload artifact: ${response.status} ${error}`);
    }

    const etag = response.headers.get('etag') || undefined;

    return {
      key,
      url: `${this.getBaseUrl()}/${this.config.bucket}/${key}`,
      size: fileBuffer.length,
      etag: etag?.replace(/"/g, ''),
    };
  }

  private async uploadDirectory(
    projectId: string,
    deploymentId: string,
    dirPath: string,
  ): Promise<UploadResult> {
    const tar = require('tar');
    const tmpDir = require('os').tmpdir();
    const archivePath = path.join(tmpDir, `deployx-${deploymentId}.tar.gz`);

    await tar.create(
      {
        gzip: true,
        file: archivePath,
        cwd: dirPath,
      },
      ['.'],
    );

    const result = await this.uploadBuildArtifact(projectId, deploymentId, archivePath);

    try {
      fs.unlinkSync(archivePath);
    } catch {}

    return result!;
  }

  async downloadBuildArtifact(
    key: string,
    outputPath: string,
  ): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Artifact storage not configured');
    }

    const url = `${this.getBaseUrl()}/${this.config.bucket}/${key}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders('GET', `/${this.config.bucket}/${key}`),
    });

    if (!response.ok) {
      throw new Error(`Failed to download artifact: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, buffer);

    return outputPath;
  }

  async deleteBuildArtifact(key: string): Promise<void> {
    if (!this.isConfigured) return;

    const url = `${this.getBaseUrl()}/${this.config.bucket}/${key}`;

    await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders('DELETE', `/${this.config.bucket}/${key}`),
    });
  }

  async listBuildArtifacts(projectId: string, deploymentId: string): Promise<Array<{ key: string; size: number; lastModified: string }>> {
    if (!this.isConfigured) return [];

    const prefix = `builds/${projectId}/${deploymentId}/`;
    const url = `${this.getBaseUrl()}/${this.config.bucket}?list-type=2&prefix=${encodeURIComponent(prefix)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders('GET', `/${this.config.bucket}`),
    });

    if (!response.ok) return [];

    const xml = await response.text();
    return this.parseListBucketResult(xml);
  }

  async getArtifactUrl(key: string, expiresIn: number = 3600): Promise<string> {
    return `${this.getBaseUrl()}/${this.config.bucket}/${key}`;
  }

  private parseListBucketResult(xml: string): Array<{ key: string; size: number; lastModified: string }> {
    const results: Array<{ key: string; size: number; lastModified: string }> = [];
    const contentRegex = /<Contents>(.*?)<\/Contents>/gs;
    const keyRegex = /<Key>(.*?)<\/Key>/;
    const sizeRegex = /<Size>(.*?)<\/Size>/;
    const dateRegex = /<LastModified>(.*?)<\/LastModified>/;

    let match;
    while ((match = contentRegex.exec(xml)) !== null) {
      const content = match[1];
      const key = keyRegex.exec(content)?.[1] || '';
      const size = parseInt(sizeRegex.exec(content)?.[1] || '0', 10);
      const lastModified = dateRegex.exec(content)?.[1] || '';
      results.push({ key, size, lastModified });
    }

    return results;
  }

  private getAuthHeaders(method: string, path: string): Record<string, string> {
    const date = new Date().toUTCString();
    const contentType = method === 'PUT' ? 'application/octet-stream' : '';

    const stringToSign = `${method}\n\n${contentType}\n${date}\n${path}`;
    const signature = this.hmacSha1(this.config.secretKey, stringToSign);

    return {
      'Date': date,
      'Authorization': `AWS ${this.config.accessKey}:${signature}`,
    };
  }

  private hmacSha1(key: string, data: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha1', key).update(data).digest('base64');
  }
}
