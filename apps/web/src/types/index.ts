import type {
  DeploymentDto,
  DeploymentStatus,
  ProjectDto,
  OrganizationDto,
  UserDto,
  MembershipRole,
} from "@deployx/shared";

// Frontend-specific extensions

export interface ProjectWithLatestDeployment extends ProjectDto {
  latestDeployment?: DeploymentDto | null;
  deploymentCount?: number;
  domainCount?: number;
}

export interface DeploymentWithProject extends DeploymentDto {
  project?: Pick<ProjectDto, "id" | "name" | "slug">;
}

export interface OrgWithMembership extends OrganizationDto {
  membership: {
    role: MembershipRole;
    joinedAt: Date;
  };
}

export interface UserProfile extends UserDto {
  organizations: OrgWithMembership[];
}

export interface Notification {
  id: string;
  type: "deployment" | "domain" | "team" | "billing" | "system";
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  type: "deployment.created" | "deployment.succeeded" | "deployment.failed" | "project.created" | "member.invited" | "member.removed" | "domain.added";
  actor: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  target: {
    id: string;
    name: string;
    type: string;
  };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type TabStatus = "ready" | "building" | "error" | "queued" | "canceled";
