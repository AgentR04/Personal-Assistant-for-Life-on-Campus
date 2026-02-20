import { Request, Response, Router } from "express";
import { authenticate } from "../middleware/auth";
import CalendarService from "../services/CalendarService";
import { logger } from "../utils/logger";

const router = Router();

/**
 * GET /api/v1/calendar/generate/:studentId
 * Generate and download a .ics calendar file for a student
 */
router.get(
  "/generate/:studentId",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.params.studentId as string;

      logger.info(`Calendar generation requested for student: ${studentId}`);

      const icsContent = CalendarService.generateICS(studentId);

      // Set headers for .ics file download
      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="timetable-${studentId}.ics"`,
      );
      res.send(icsContent);
    } catch (error) {
      logger.error("Generate calendar error:", error);
      res.status(500).json({ error: "Failed to generate calendar" });
    }
  },
);

/**
 * GET /api/v1/calendar/timetable
 * Get the timetable as structured JSON
 */
router.get(
  "/timetable",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const timetable = CalendarService.getTimetableByDay();

      res.json({
        success: true,
        data: { timetable },
      });
    } catch (error) {
      logger.error("Get timetable error:", error);
      res.status(500).json({ error: "Failed to get timetable" });
    }
  },
);

export default router;
