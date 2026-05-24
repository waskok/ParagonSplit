import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";

export type AppJwtPayload = JwtPayload & {
  userId: string;
  email: string;
};

export const generateToken = (payload: { userId: string; email: string }): string => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
};

export const verifyToken = (token: string): AppJwtPayload => {
  return jwt.verify(token, env.jwtSecret) as AppJwtPayload;
};
