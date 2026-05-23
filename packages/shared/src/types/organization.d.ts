export declare enum Plan {
    HOBBY = "HOBBY",
    PRO = "PRO",
    ENTERPRISE = "ENTERPRISE"
}
export declare enum MembershipRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    MEMBER = "MEMBER",
    VIEWER = "VIEWER"
}
export interface CreateOrganizationRequest {
    name: string;
    slug?: string;
}
export interface UpdateOrganizationRequest {
    name?: string;
    slug?: string;
    plan?: Plan;
}
export interface OrganizationDto {
    id: string;
    name: string;
    slug: string;
    plan: Plan;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface MembershipDto {
    id: string;
    userId: string;
    orgId: string;
    role: MembershipRole;
    joinedAt: Date;
}
export interface InviteMemberRequest {
    email: string;
    role: MembershipRole;
}
export interface UpdateMembershipRequest {
    role: MembershipRole;
}
//# sourceMappingURL=organization.d.ts.map