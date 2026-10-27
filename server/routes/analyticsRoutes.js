import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getWeeklyAnalytics } from "../controllers/moodController.js";

const router = Router();
router.get("/weekly", requireAuth, getWeeklyAnalytics);

export default router;
