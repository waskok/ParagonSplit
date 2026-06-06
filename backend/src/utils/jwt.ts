import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type AppJwtPayload = JwtPayload & {
  userId: string;
  email: string;
};

export const generateToken = (payload: { userId: string; email: string }): string => {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtSecret, options);
};

export const verifyToken = (token: string): AppJwtPayload => {
  return jwt.verify(token, env.jwtSecret) as AppJwtPayload;
};
