import { Router } from "express";
import { login, register } from "../controllers/authController";
import { authRateLimiter } from "../middlewares/rateLimitMiddleware";

const authRouter = Router();

authRouter.use(authRateLimiter);
authRouter.post("/register", register);
authRouter.post("/login", login);

export default authRouter;
