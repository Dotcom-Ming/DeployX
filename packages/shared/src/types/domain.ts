export enum SslStatus {
  PENDING = "PENDING",
  ISSUED = "ISSUED",
  RENEWING = "RENEWING",
  ERROR = "ERROR",
}

export interface CreateDomainRequest {
  name: string;
  projectId: string;
}

export interface UpdateDomainRequest {
  name?: string;
}

export interface DomainDto {
  id: string;
  name: string;
  projectId: string;
  sslStatus: SslStatus;
  sslExpiresAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainVerificationDto {
  domain: string;
  verificationMethod: string;
  verificationValue: string;
  verified: boolean;
}
