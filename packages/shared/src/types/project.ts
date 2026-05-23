export enum Framework {
  NEXTJS = "NEXTJS",
  NUXT = "NUXT",
  VITE = "VITE",
  ASTRO = "ASTRO",
  REMIX = "REMIX",
  STATIC = "STATIC",
  NODE = "NODE",
}

export enum GitProvider {
  GITHUB = "GITHUB",
  GITLAB = "GITLAB",
  BITBUCKET = "BITBUCKET",
}

export interface CreateProjectRequest {
  name: string;
  framework: Framework;
  gitProvider: GitProvider;
  repositoryUrl: string;
  branch: string;
  rootDirectory?: string;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  envVars?: Record<string, string>;
}

export interface UpdateProjectRequest {
  name?: string;
  branch?: string;
  rootDirectory?: string;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  envVars?: Record<string, string>;
}

export interface ProjectDto {
  id: string;
  name: string;
  slug: string;
  framework: Framework;
  gitProvider: GitProvider;
  repositoryUrl: string;
  branch: string;
  rootDirectory: string;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
}
