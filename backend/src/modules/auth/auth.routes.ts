import { Router } from "express";
import * as authController from "./auth.controller.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { validateOrigin } from "../../middlewares/origin.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import {
  registerLimiter,
  loginLimiter,
  refreshLimiter,
} from "./auth.rate-limiter.js";

const router = Router();

router.post(
  "/register",
  validateOrigin,
  registerLimiter,
  validateBody(registerSchema),
  authController.register,
);

router.post(
  "/login",
  validateOrigin,
  loginLimiter,
  validateBody(loginSchema),
  authController.login,
);

router.post("/refresh", validateOrigin, refreshLimiter, authController.refresh);

router.post("/logout", validateOrigin, authController.logout);

router.get("/me", authenticate, authController.getMe);

export default router;
