import { type NextFunction, type Request, type Response } from "express";
import { prisma } from "../config/prisma";
import { verifyToken } from "../utils/jwt";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Brak autoryzacji." });
  }

  try {
    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return res.status(401).json({ message: "Nieprawidłowy token." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Nieprawidłowy token." });
  }
};
