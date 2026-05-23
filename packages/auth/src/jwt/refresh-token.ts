import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
}

export function signRefreshToken(
  payload: RefreshTokenPayload
): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set");
  }

  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyRefreshToken(
  token: string
): JwtPayload & RefreshTokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set");
  }

  return jwt.verify(token, secret) as JwtPayload & RefreshTokenPayload;
}
