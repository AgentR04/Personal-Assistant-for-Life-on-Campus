import { Request, Response, Router } from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth";
import QuestService from "../services/QuestService";
import { logger } from "../utils/logger";

const router = Router();

/**
 * GET /api/v1/quests/status
 * Get current quest status for authenticated student
 */
router.get(
  "/status",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const status = await QuestService.getQuestStatus(req.user.userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error("Get quest status error:", error);
      res.status(500).json({ error: "Failed to get quest status" });
    }
  },
);

/**
 * POST /api/v1/quests/complete
 * Complete a quest task
 */
router.post(
  "/complete",
  authenticate,
  [body("taskId").trim().notEmpty().withMessage("Task ID is required")],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const { taskId } = req.body;

      logger.info(
        `Quest completion request: student=${req.user.userId}, task=${taskId}`,
      );

      const result = await QuestService.completeQuest(req.user.userId, taskId);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      logger.error("Complete quest error:", error);
      res.status(500).json({ error: "Failed to complete quest" });
    }
  },
);

/**
 * GET /api/v1/quests/definitions
 * Get all available quest definitions
 */
router.get(
  "/definitions",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const definitions = QuestService.getQuestDefinitions();
      res.json({
        success: true,
        data: { quests: definitions },
      });
    } catch (error) {
      logger.error("Get quest definitions error:", error);
      res.status(500).json({ error: "Failed to get quest definitions" });
    }
  },
);

export default router;
