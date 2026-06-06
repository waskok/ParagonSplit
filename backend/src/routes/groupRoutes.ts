import { Router } from "express";
import { createGroup, getGroup, inviteMember, listMyGroups } from "../controllers/groupController";
import { authenticate } from "../middlewares/authMiddleware";

const groupRouter = Router();

groupRouter.use(authenticate);
groupRouter.post("/", createGroup);
groupRouter.get("/", listMyGroups);
groupRouter.get("/:id", getGroup);
groupRouter.post("/:id/invite", inviteMember);

export default groupRouter;
