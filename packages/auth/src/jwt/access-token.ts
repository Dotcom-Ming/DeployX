import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  orgId: string;
  role: string;
}

export function signAccessToken(
  payload: AccessTokenPayload
): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign(payload, secret, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): JwtPayload & AccessTokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.verify(token, secret) as JwtPayload & AccessTokenPayload;
}
