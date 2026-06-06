import type { AuthUser } from "../middlewares/authMiddleware";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
