import type { DeployXClient } from "../client";

export class EnvVariablesResource {
  constructor(private client: DeployXClient) {}

  async list(orgSlug: string, projectId: string) {
    return this.client.get<any[]>(
      `/orgs/${orgSlug}/projects/${projectId}/env`
    );
  }

  async create(
    orgSlug: string,
    projectId: string,
    data: { key: string; value: string; environment?: "production" | "preview" | "all" }
  ) {
    return this.client.post<any>(
      `/orgs/${orgSlug}/projects/${projectId}/env`,
      data
    );
  }

  async update(
    orgSlug: string,
    projectId: string,
    varId: string,
    data: { value?: string; environment?: "production" | "preview" | "all" }
  ) {
    return this.client.patch<any>(
      `/orgs/${orgSlug}/projects/${projectId}/env/${varId}`,
      data
    );
  }

  async remove(orgSlug: string, projectId: string, varId: string) {
    return this.client.delete<{ deleted: boolean }>(
      `/orgs/${orgSlug}/projects/${projectId}/env/${varId}`
    );
  }
}
