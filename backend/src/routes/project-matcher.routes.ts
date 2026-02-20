import { Request, Response, Router } from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth";
import ProjectMatcherService from "../services/ProjectMatcherService";
import { logger } from "../utils/logger";

const router = Router();

/**
 * POST /api/v1/projects/match
 * Match a student's interests to senior projects
 */
router.post(
  "/match",
  authenticate,
  [
    body("interests")
      .trim()
      .notEmpty()
      .withMessage("Interests description is required"),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { interests } = req.body;

      logger.info(
        `Project match request from user ${req.user?.userId}: "${interests}"`,
      );

      const result = await ProjectMatcherService.findMatch(interests);

      res.json({
        success: true,
        data: {
          extractedSkills: result.skills,
          bestMatch: {
            projectId: result.bestMatch.project.id,
            projectName: result.bestMatch.project.name,
            description: result.bestMatch.project.description,
            matchScore: Math.round(result.bestMatch.score * 100),
            matchedSkills: result.bestMatch.matchedSkills,
            seniorLead: result.bestMatch.project.seniorLead,
            openSlots: result.bestMatch.project.openSlots,
            introduction: result.bestMatch.introduction,
          },
          allMatches: result.allMatches,
        },
      });
    } catch (error) {
      logger.error("Project match error:", error);
      res.status(500).json({ error: "Failed to match projects" });
    }
  },
);

/**
 * GET /api/v1/projects/list
 * Get all available senior projects
 */
router.get(
  "/list",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const projects = ProjectMatcherService.getProjects();
      res.json({
        success: true,
        data: { projects },
      });
    } catch (error) {
      logger.error("Get projects error:", error);
      res.status(500).json({ error: "Failed to get projects" });
    }
  },
);

export default router;
