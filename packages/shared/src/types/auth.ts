import { MembershipRole } from "./organization";

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  orgId: string;
  role: MembershipRole;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  orgName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  orgId: string;
  orgSlug: string;
  role: MembershipRole;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum MfaMethod {
  TOTP = "TOTP",
  SMS = "SMS",
}

export interface EnableMfaRequest {
  method: MfaMethod;
  secret?: string;
}

export interface VerifyMfaRequest {
  code: string;
  method: MfaMethod;
}

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}
