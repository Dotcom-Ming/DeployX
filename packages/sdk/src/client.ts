import { ProjectsResource } from './resources/projects';
import { DeploymentsResource } from './resources/deployments';
import { DomainsResource } from './resources/domains';
import { EnvVariablesResource } from './resources/env-variables';
import { OrganizationsResource } from './resources/organizations';

export class DeployXClient {
  private baseURL: string;
  private apiToken: string;
  public projects: ProjectsResource;
  public deployments: DeploymentsResource;
  public domains: DomainsResource;
  public envVariables: EnvVariablesResource;
  public organizations: OrganizationsResource;

  constructor(config: { baseURL: string; apiToken: string }) {
    this.baseURL = config.baseURL;
    this.apiToken = config.apiToken;
    this.projects = new ProjectsResource(this);
    this.deployments = new DeploymentsResource(this);
    this.domains = new DomainsResource(this);
    this.envVariables = new EnvVariablesResource(this);
    this.organizations = new OrganizationsResource(this);
  }

  private buildURL(path: string, params?: Record<string, any>): string {
    const url = new URL(`/v1${path}`, this.baseURL);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiToken}`,
    };
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = this.buildURL(path, params);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new DeployXError(response.status, error.message || error.code || 'Unknown error');
    }

    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body?: any): Promise<T> {
    const url = this.buildURL(path);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new DeployXError(response.status, error.message || error.code || 'Unknown error');
    }

    return response.json() as Promise<T>;
  }

  async patch<T>(path: string, body?: any): Promise<T> {
    const url = this.buildURL(path);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new DeployXError(response.status, error.message || error.code || 'Unknown error');
    }

    return response.json() as Promise<T>;
  }

  async delete<T>(path: string): Promise<T> {
    const url = this.buildURL(path);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new DeployXError(response.status, error.message || error.code || 'Unknown error');
    }

    return response.json() as Promise<T>;
  }
}

export class DeployXError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'DeployXError';
    this.status = status;
  }
}
