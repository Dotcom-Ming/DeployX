// SDK types - self-contained to avoid rootDir issues with @deployx/shared
// These mirror the types from @deployx/shared for SDK consumers

export interface ProjectDto {
  id: string;
  name: string;
  slug: string;
  framework: string;
  gitProvider: string;
  gitRepo?: string;
  rootDir: string;
  buildCmd?: string;
  outputDir?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentDto {
  id: string;
  projectId: string;
  commitSha?: string;
  commitMessage?: string;
  branch?: string;
  status: string;
  type: string;
  url?: string;
  buildDuration?: number;
  createdAt: string;
}

export interface DomainDto {
  id: string;
  projectId: string;
  domain: string;
  sslStatus: string;
  verified: boolean;
}

export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    hasNextPage: boolean;
  };
}
