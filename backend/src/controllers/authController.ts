import { type Request, type Response } from "express";
import { prisma } from "../config/prisma";
import { comparePassword, hashPassword } from "../utils/hash";
import { generateToken } from "../utils/jwt";

type RegisterBody = {
  email?: string;
  password?: string;
  name?: string;
};

type LoginBody = {
  email?: string;
  password?: string;
};

export const register = async (
  req: Request<unknown, unknown, RegisterBody>,
  res: Response
) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();
    const name = req.body.name?.trim();

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password and name are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already in use." });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user
    });
  } catch (error) {
    console.error("register error", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const login = async (req: Request<unknown, unknown, LoginBody>, res: Response) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error("login error", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
