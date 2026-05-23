import type { DeployXClient } from "../client";

export class OrganizationsResource {
  constructor(private client: DeployXClient) {}

  async list() {
    return this.client.get<any[]>("/orgs");
  }

  async get(orgSlug: string) {
    return this.client.get<any>(`/orgs/${orgSlug}`);
  }

  async create(data: { name: string; slug: string }) {
    return this.client.post<any>("/orgs", data);
  }

  async update(orgSlug: string, data: { name?: string; slug?: string }) {
    return this.client.patch<any>(`/orgs/${orgSlug}`, data);
  }

  async getMembers(orgSlug: string) {
    return this.client.get<any[]>(`/orgs/${orgSlug}/members`);
  }

  async inviteMember(
    orgSlug: string,
    data: { email: string; role: "admin" | "developer" | "viewer" }
  ) {
    return this.client.post<any>(`/orgs/${orgSlug}/members/invite`, data);
  }
}
