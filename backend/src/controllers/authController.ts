import { type Request, type Response } from "express";
import { prisma } from "../config/prisma";
import { comparePassword, hashPassword } from "../utils/hash";
import { generateToken } from "../utils/jwt";

type RegisterBody = {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  username?: string;
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
    const passwordConfirm = req.body.passwordConfirm?.trim();
    const username = req.body.username?.trim();

    if (!email || !password || !username) {
      return res.status(400).json({ message: "Email, hasło i nazwa użytkownika są wymagane." });
    }

    if (!passwordConfirm) {
      return res.status(400).json({ message: "Powtórz hasło." });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ message: "Hasła nie są identyczne." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Hasło musi mieć co najmniej 6 znaków." });
    }

    if (username.length < 2) {
      return res.status(400).json({ message: "Nazwa użytkownika musi mieć co najmniej 2 znaki." });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Ten email jest już zajęty." });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        username
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(201).json({
      message: "Konto utworzone pomyślnie.",
      user
    });
  } catch (error) {
    console.error("register error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const login = async (req: Request<unknown, unknown, LoginBody>, res: Response) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!email || !password) {
      return res.status(400).json({ message: "Email i hasło są wymagane." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Nieprawidłowy email lub hasło." });
    }

    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ message: "Nieprawidłowy email lub hasło." });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    return res.status(200).json({
      message: "Zalogowano pomyślnie.",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error("login error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};
