import type { DeployXClient } from "../client";

export class DeploymentsResource {
  constructor(private client: DeployXClient) {}

  async list(
    orgSlug: string,
    projectId: string,
    params?: { page?: number; perPage?: number; environment?: string }
  ) {
    return this.client.get<{
      data: any[];
      meta: { page: number; perPage: number; total: number };
    }>(`/orgs/${orgSlug}/projects/${projectId}/deployments`, params);
  }

  async get(orgSlug: string, projectId: string, deploymentId: string) {
    return this.client.get<any>(
      `/orgs/${orgSlug}/projects/${projectId}/deployments/${deploymentId}`
    );
  }

  async trigger(
    orgSlug: string,
    projectId: string,
    data: { branch?: string; environment?: string; commitSha?: string }
  ) {
    return this.client.post<any>(
      `/orgs/${orgSlug}/projects/${projectId}/deployments`,
      data
    );
  }

  async cancel(orgSlug: string, projectId: string, deploymentId: string) {
    return this.client.post<any>(
      `/orgs/${orgSlug}/projects/${projectId}/deployments/${deploymentId}/cancel`
    );
  }

  async redeploy(orgSlug: string, projectId: string, deploymentId: string) {
    return this.client.post<any>(
      `/orgs/${orgSlug}/projects/${projectId}/deployments/${deploymentId}/redeploy`
    );
  }

  async getLogs(orgSlug: string, projectId: string, deploymentId: string) {
    return this.client.get<any[]>(
      `/orgs/${orgSlug}/projects/${projectId}/deployments/${deploymentId}/logs`
    );
  }
}
