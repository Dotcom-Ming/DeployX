import type { DeployXClient } from "../client";

export class DomainsResource {
  constructor(private client: DeployXClient) {}

  async list(orgSlug: string, projectId: string) {
    return this.client.get<any[]>(
      `/orgs/${orgSlug}/projects/${projectId}/domains`
    );
  }

  async add(orgSlug: string, projectId: string, domain: string) {
    return this.client.post<any>(
      `/orgs/${orgSlug}/projects/${projectId}/domains`,
      { domain }
    );
  }

  async remove(orgSlug: string, projectId: string, domainId: string) {
    return this.client.delete<{ deleted: boolean }>(
      `/orgs/${orgSlug}/projects/${projectId}/domains/${domainId}`
    );
  }

  async verify(orgSlug: string, projectId: string, domainId: string) {
    return this.client.post<any>(
      `/orgs/${orgSlug}/projects/${projectId}/domains/${domainId}/verify`
    );
  }
}
