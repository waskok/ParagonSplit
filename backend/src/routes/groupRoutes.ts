import { Router } from "express";
import {
  acceptInvitation,
  createGroup,
  declineInvitation,
  deleteGroup,
  getGroup,
  inviteMember,
  listMyGroups,
  listPendingInvitations,
  removeMember
} from "../controllers/groupController";
import { authenticate } from "../middlewares/authMiddleware";

const groupRouter = Router();

groupRouter.use(authenticate);
groupRouter.post("/", createGroup);
groupRouter.get("/", listMyGroups);
groupRouter.get("/invitations/pending", listPendingInvitations);
groupRouter.post("/invitations/:invitationId/accept", acceptInvitation);
groupRouter.post("/invitations/:invitationId/decline", declineInvitation);
groupRouter.get("/:id", getGroup);
groupRouter.delete("/:id", deleteGroup);
groupRouter.post("/:id/invite", inviteMember);
groupRouter.delete("/:id/members/:userId", removeMember);

export default groupRouter;
