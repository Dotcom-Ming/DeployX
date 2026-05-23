import type { DeployXClient } from '../client';

export class ProjectsResource {
  constructor(private client: DeployXClient) {}

  async list(
    orgSlug: string,
    params?: { page?: number; perPage?: number; search?: string }
  ) {
    return this.client.get<{
      data: any[];
      meta: { page: number; perPage: number; total: number };
    }>(`/orgs/${orgSlug}/projects`, params);
  }

  async get(orgSlug: string, projectId: string) {
    return this.client.get<any>(`/orgs/${orgSlug}/projects/${projectId}`);
  }

  async create(orgSlug: string, data: { name: string; region?: string; framework?: string }) {
    return this.client.post<any>(`/orgs/${orgSlug}/projects`, data);
  }

  async update(
    orgSlug: string,
    projectId: string,
    data: { name?: string; region?: string; framework?: string }
  ) {
    return this.client.patch<any>(`/orgs/${orgSlug}/projects/${projectId}`, data);
  }

  async delete(orgSlug: string, projectId: string) {
    return this.client.delete<{ deleted: boolean }>(
      `/orgs/${orgSlug}/projects/${projectId}`
    );
  }
}
