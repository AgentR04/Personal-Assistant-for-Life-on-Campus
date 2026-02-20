import express, { Request, Response } from "express";
import { DocumentOrganizationService } from "../services/DocumentOrganizationService";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();
const docOrgService = new DocumentOrganizationService();

/**
 * GET /api/admin/documents/search
 * Search students and their documents
 */
router.get(
  "/search",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }

      const { search, branch, year } = req.query;

      const students = await docOrgService.searchStudents({
        searchQuery: search as string,
        branch: branch as string,
        year: year as string,
      });

      return res.status(200).json({
        success: true,
        data: students,
      });
    } catch (error: any) {
      console.error("Error searching students:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to search students",
      });
    }
  }
);

/**
 * GET /api/admin/documents/student/:userId
 * Get all documents for a specific student
 */
router.get(
  "/student/:userId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }

      const { userId } = req.params;

      const documents = await docOrgService.getStudentDocuments(userId);

      return res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      console.error("Error fetching student documents:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch documents",
      });
    }
  }
);

/**
 * GET /api/admin/documents/structure
 * Get folder structure (branches and years)
 */
router.get(
  "/structure",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }

      const structure = await docOrgService.getFolderStructure();

      return res.status(200).json({
        success: true,
        data: structure,
      });
    } catch (error: any) {
      console.error("Error fetching folder structure:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch folder structure",
      });
    }
  }
);

/**
 * GET /api/admin/documents/download/:documentId/:userId
 * Download a specific document
 */
router.get(
  "/download/:documentId/:userId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }

      const { documentId, userId } = req.params;

      const fileBuffer = await docOrgService.downloadDocument(documentId, userId);

      // Set headers for file download
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=document-${documentId}.pdf`
      );

      return res.send(fileBuffer);
    } catch (error: any) {
      console.error("Error downloading document:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to download document",
      });
    }
  }
);

export default router;
