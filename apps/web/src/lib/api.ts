const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3006";

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof document !== "undefined") {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}/api${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...getHeaders(), ...init?.headers },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `请求失败: ${res.status}` }));
    throw new Error(error.message || `API 错误: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number; hasNextPage: boolean };
}

// ---- Projects ----
export async function getProjects(orgSlug: string, params?: { page?: number; perPage?: number; search?: string }) {
  return fetchApi<PaginatedResponse<any>>(`/orgs/${orgSlug}/projects`, {
    method: "GET",
  });
}

export async function getProject(orgSlug: string, projectId: string) {
  return fetchApi<any>(`/orgs/${orgSlug}/projects/${projectId}`);
}

// ---- Deployments ----
export async function getDeployments(orgSlug: string, projectId: string, params?: { page?: number; perPage?: number; environment?: string }) {
  return fetchApi<PaginatedResponse<any>>(`/orgs/${orgSlug}/projects/${projectId}/deployments`);
}

export async function getDeployment(orgSlug: string, projectId: string, deploymentId: string) {
  return fetchApi<any>(`/orgs/${orgSlug}/projects/${projectId}/deployments/${deploymentId}`);
}

export async function getDeploymentLogs(orgSlug: string, projectId: string, deploymentId: string) {
  return fetchApi<any[]>(`/orgs/${orgSlug}/projects/${projectId}/deployments/${deploymentId}/logs`);
}

export async function triggerDeployment(orgSlug: string, projectId: string, data: { branch?: string; environment?: string; commitSha?: string }) {
  return fetchApi<any>(`/orgs/${orgSlug}/projects/${projectId}/deployments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function cancelDeployment(orgSlug: string, projectId: string, deploymentId: string) {
  return fetchApi<any>(`/orgs/${orgSlug}/projects/${projectId}/deployments/${deploymentId}/cancel`, {
    method: "POST",
  });
}

export async function redeployDeployment(orgSlug: string, projectId: string, deploymentId: string) {
  return fetchApi<any>(`/orgs/${orgSlug}/projects/${projectId}/deployments/${deploymentId}/redeploy`, {
    method: "POST",
  });
}

// ---- Domains ----
export async function getDomains(orgSlug: string, projectId: string) {
  return fetchApi<any[]>(`/orgs/${orgSlug}/projects/${projectId}/domains`);
}

export async function addDomain(orgSlug: string, projectId: string, domain: string) {
  return fetchApi<any>(`/orgs/${orgSlug}/projects/${projectId}/domains`, {
    method: "POST",
    body: JSON.stringify({ domain }),
  });
}

export async function removeDomain(orgSlug: string, projectId: string, domainId: string) {
  return fetchApi<{ deleted: boolean }>(`/orgs/${orgSlug}/projects/${projectId}/domains/${domainId}`, {
    method: "DELETE",
  });
}

export async function verifyDomain(orgSlug: string, projectId: string, domainId: string) {
  return fetchApi<any>(`/orgs/${orgSlug}/projects/${projectId}/domains/${domainId}/verify`, {
    method: "POST",
  });
}

// ---- Env Variables ----
export async function getEnvVariables(orgSlug: string, projectId: string) {
  return fetchApi<any[]>(`/orgs/${orgSlug}/projects/${projectId}/env`);
}

export async function createEnvVariable(orgSlug: string, projectId: string, data: { key: string; value: string; environment?: string }) {
  return fetchApi<any>(`/orgs/${orgSlug}/projects/${projectId}/env`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEnvVariable(orgSlug: string, projectId: string, varId: string, data: { value?: string; environment?: string }) {
  return fetchApi<any>(`/orgs/${orgSlug}/projects/${projectId}/env/${varId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteEnvVariable(orgSlug: string, projectId: string, varId: string) {
  return fetchApi<{ deleted: boolean }>(`/orgs/${orgSlug}/projects/${projectId}/env/${varId}`, {
    method: "DELETE",
  });
}

// ---- Organizations ----
export async function getOrganization(orgSlug: string) {
  return fetchApi<any>(`/orgs/${orgSlug}`);
}

export async function getOrgMembers(orgSlug: string) {
  return fetchApi<any[]>(`/orgs/${orgSlug}/members`);
}
