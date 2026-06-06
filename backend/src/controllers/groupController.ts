import { type Request, type Response } from "express";
import { prisma } from "../config/prisma";
import { isGroupMember, isGroupOwner } from "../utils/groupAccess";

type CreateGroupBody = { name?: string };
type InviteBody = { email?: string };

const userSelect = { id: true, username: true, email: true };

const memberSelect = {
  id: true,
  role: true,
  joinedAt: true,
  user: { select: userSelect }
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
        owner: { select: userSelect },
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
            owner: { select: userSelect },
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

export const listPendingInvitations = async (req: Request, res: Response) => {
  try {
    const email = req.user!.email;

    const invitations = await prisma.groupInvitation.findMany({
      where: { email, status: "PENDING" },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            owner: { select: userSelect },
            _count: { select: { members: true } }
          }
        },
        invitedBy: { select: userSelect }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({ invitations });
  } catch (error) {
    console.error("listPendingInvitations error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const acceptInvitation = async (req: Request<{ invitationId: string }>, res: Response) => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;
    const { invitationId } = req.params;

    const invitation = await prisma.groupInvitation.findUnique({
      where: { id: invitationId },
      include: { group: { select: { id: true, name: true } } }
    });

    if (!invitation) {
      return res.status(404).json({ message: "Zaproszenie nie istnieje." });
    }

    if (invitation.email !== email) {
      return res.status(403).json({ message: "To zaproszenie nie jest dla Ciebie." });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ message: "Zaproszenie zostało już rozpatrzone." });
    }

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: invitation.groupId, userId } }
    });
    if (existing) {
      await prisma.groupInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" }
      });
      return res.status(200).json({
        message: "Jesteś już w tej grupie.",
        groupId: invitation.groupId
      });
    }

    await prisma.$transaction([
      prisma.groupMember.create({
        data: { groupId: invitation.groupId, userId, role: "MEMBER" }
      }),
      prisma.groupInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" }
      })
    ]);

    return res.status(200).json({
      message: `Dołączono do grupy „${invitation.group.name}".`,
      groupId: invitation.groupId
    });
  } catch (error) {
    console.error("acceptInvitation error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const declineInvitation = async (req: Request<{ invitationId: string }>, res: Response) => {
  try {
    const email = req.user!.email;
    const { invitationId } = req.params;

    const invitation = await prisma.groupInvitation.findUnique({ where: { id: invitationId } });

    if (!invitation) {
      return res.status(404).json({ message: "Zaproszenie nie istnieje." });
    }

    if (invitation.email !== email) {
      return res.status(403).json({ message: "To zaproszenie nie jest dla Ciebie." });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ message: "Zaproszenie zostało już rozpatrzone." });
    }

    await prisma.groupInvitation.update({
      where: { id: invitationId },
      data: { status: "DECLINED" }
    });

    return res.status(200).json({ message: "Zaproszenie odrzucone." });
  } catch (error) {
    console.error("declineInvitation error", error);
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
        owner: { select: userSelect },
        members: { select: memberSelect },
        invitations: {
          where: { status: "PENDING" },
          select: { id: true, email: true, status: true, createdAt: true }
        },
        receipts: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            uploadedBy: { select: { id: true, username: true } },
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

    if (email === req.user!.email) {
      return res.status(400).json({ message: "Nie możesz zaprosić samego siebie." });
    }

    const invitedUser = await prisma.user.findUnique({ where: { email } });
    if (invitedUser) {
      const existing = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: invitedUser.id } }
      });
      if (existing) {
        return res.status(409).json({ message: "Użytkownik jest już w grupie." });
      }
    }

    const pendingInvite = await prisma.groupInvitation.findUnique({
      where: { groupId_email: { groupId, email } }
    });
    if (pendingInvite?.status === "PENDING") {
      return res.status(409).json({ message: "Zaproszenie dla tego adresu jest już wysłane." });
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
      message: invitedUser
        ? `Zaproszenie wysłane do ${invitedUser.username}.`
        : "Zaproszenie zapisane. Użytkownik zobaczy je po rejestracji na ten email."
    });
  } catch (error) {
    console.error("inviteMember error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const removeMember = async (
  req: Request<{ id: string; userId: string }>,
  res: Response
) => {
  try {
    const ownerId = req.user!.id;
    const { id: groupId, userId: targetUserId } = req.params;

    const owner = await isGroupOwner(groupId, ownerId);
    if (!owner) {
      return res.status(403).json({ message: "Tylko właściciel może usuwać członków." });
    }

    if (targetUserId === ownerId) {
      return res.status(400).json({ message: "Nie możesz usunąć siebie jako właściciela." });
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } }
    });

    if (!membership) {
      return res.status(404).json({ message: "Użytkownik nie należy do tej grupy." });
    }

    if (membership.role === "OWNER") {
      return res.status(400).json({ message: "Nie można usunąć właściciela grupy." });
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } }
    });

    return res.status(200).json({ message: "Użytkownik został usunięty z grupy." });
  } catch (error) {
    console.error("removeMember error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};

export const deleteGroup = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: groupId } = req.params;

    const owner = await isGroupOwner(groupId, userId);
    if (!owner) {
      return res.status(403).json({ message: "Tylko właściciel może usunąć grupę." });
    }

    await prisma.group.delete({ where: { id: groupId } });

    return res.status(200).json({ message: "Grupa została usunięta." });
  } catch (error) {
    console.error("deleteGroup error", error);
    return res.status(500).json({ message: "Błąd serwera." });
  }
};
