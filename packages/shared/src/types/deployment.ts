export enum DeploymentStatus {
  PENDING = "PENDING",
  BUILDING = "BUILDING",
  READY = "READY",
  ERROR = "ERROR",
  CANCELLED = "CANCELLED",
  QUEUED = "QUEUED",
}

export enum DeploymentType {
  PRODUCTION = "PRODUCTION",
  PREVIEW = "PREVIEW",
  ROLLBACK = "ROLLBACK",
}

export enum BuildStage {
  CLONING = "CLONING",
  INSTALLING = "INSTALLING",
  BUILDING = "BUILDING",
  DEPLOYING = "DEPLOYING",
  READY = "READY",
}

export interface CreateDeploymentRequest {
  projectId: string;
  branch: string;
  commitSha?: string;
  type: DeploymentType;
}

export interface DeploymentDto {
  id: string;
  projectId: string;
  branch: string;
  commitSha: string;
  commitMessage?: string;
  status: DeploymentStatus;
  type: DeploymentType;
  buildStage: BuildStage;
  buildLogsUrl?: string;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeploymentListQuery {
  projectId: string;
  status?: DeploymentStatus;
  type?: DeploymentType;
  branch?: string;
}
