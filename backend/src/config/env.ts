const JWT_EXPIRES_IN = "7d";

export const env = {
  jwtSecret: process.env.JWT_SECRET || "dev-jwt-secret",
  jwtExpiresIn: JWT_EXPIRES_IN
};
