import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  createMood,
  getMoods,
  getMoodById,
  updateMood,
  deleteMood
} from "../controllers/moodController.js";

const router = Router();
router.use(requireAuth);

router.route("/").get(getMoods).post(createMood);
router.route("/:id").get(getMoodById).put(updateMood).delete(deleteMood);

export default router;
