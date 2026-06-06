import { prisma } from "../config/prisma";

export const isGroupMember = async (groupId: string, userId: string): Promise<boolean> => {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } }
  });
  return Boolean(membership);
};

export const isGroupOwner = async (groupId: string, userId: string): Promise<boolean> => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { ownerId: true }
  });
  return group?.ownerId === userId;
};
