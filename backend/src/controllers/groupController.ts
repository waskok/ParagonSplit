import { type Request, type Response } from "express";
import { prisma } from "../config/prisma";
import { isGroupMember, isGroupOwner } from "../utils/groupAccess";

type CreateGroupBody = { name?: string };
type InviteBody = { email?: string };

const memberSelect = {
  id: true,
  role: true,
  joinedAt: true,
  user: { select: { id: true, name: true, email: true } }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const name = req.body.name?.trim();

    if (!name || name.length < 2) {
      return res.status(400).json({ message: "Nazwa grupy musi mieć co najmniej 2 znaki." });
    }

    const group = await prisma.group.create({
      data: {
        name,
        ownerId: userId,
        members: {
          create: { userId, role: "OWNER" }
        }
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { select: memberSelect },
        _count: { select: { receipts: true } }
      }
    });

    return res.status(201).json({ message: "Grupa utworzona.", group });
  } catch (error) {
    console.error("createGroup error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const listMyGroups = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            members: { select: memberSelect },
            _count: { select: { receipts: true, members: true } }
          }
        }
      },
      orderBy: { joinedAt: "desc" }
    });

    const groups = memberships.map((m) => ({
      ...m.group,
      myRole: m.role
    }));

    return res.status(200).json({ groups });
  } catch (error) {
    console.error("listMyGroups error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const getGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const groupId = req.params.id;

    const member = await isGroupMember(groupId, userId);
    if (!member) {
      return res.status(403).json({ message: "Nie masz dostępu do tej grupy." });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { select: memberSelect },
        invitations: {
          where: { status: "PENDING" },
          select: { id: true, email: true, status: true, createdAt: true }
        },
        receipts: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            uploadedBy: { select: { id: true, name: true } },
            _count: { select: { items: true } }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ message: "Grupa nie istnieje." });
    }

    const myMembership = group.members.find((m) => m.user.id === userId);

    return res.status(200).json({
      group: {
        ...group,
        myRole: myMembership?.role ?? null
      }
    });
  } catch (error) {
    console.error("getGroup error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const inviteMember = async (
  req: Request<{ id: string }, unknown, InviteBody>,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const groupId = req.params.id;
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Podaj adres email." });
    }

    const owner = await isGroupOwner(groupId, userId);
    if (!owner) {
      return res.status(403).json({ message: "Tylko właściciel może zapraszać członków." });
    }

    const invitedUser = await prisma.user.findUnique({ where: { email } });
    if (invitedUser?.id === userId) {
      return res.status(400).json({ message: "Nie możesz zaprosić samego siebie." });
    }

    if (invitedUser) {
      const existing = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: invitedUser.id } }
      });
      if (existing) {
        return res.status(409).json({ message: "Użytkownik jest już w grupie." });
      }

      await prisma.groupMember.create({
        data: { groupId, userId: invitedUser.id, role: "MEMBER" }
      });

      await prisma.groupInvitation.upsert({
        where: { groupId_email: { groupId, email } },
        update: { status: "ACCEPTED" },
        create: {
          groupId,
          email,
          status: "ACCEPTED",
          invitedById: userId
        }
      });

      return res.status(200).json({
        message: `${invitedUser.name} został dodany do grupy.`,
        added: true
      });
    }

    await prisma.groupInvitation.upsert({
      where: { groupId_email: { groupId, email } },
      update: { status: "PENDING", invitedById: userId },
      create: {
        groupId,
        email,
        status: "PENDING",
        invitedById: userId
      }
    });

    return res.status(200).json({
      message: "Zaproszenie zapisane. Użytkownik dołączy po rejestracji na ten email.",
      added: false
    });
  } catch (error) {
    console.error("inviteMember error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};
