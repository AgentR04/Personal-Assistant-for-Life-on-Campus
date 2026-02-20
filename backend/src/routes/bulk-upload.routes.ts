import express, { Request, Response } from "express";
import multer from "multer";
import { BulkUploadService } from "../services/BulkUploadService";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Configure multer for file upload (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only Excel and CSV files
    const allowedMimes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed."));
    }
  },
});

/**
 * POST /api/bulk-upload
 * Upload and process Excel/CSV file to create user profiles
 * 
 * This is the endpoint that gets called when admin clicks "Upload & Process"
 */
router.post(
  "/",
  authenticateToken,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded. Please select a file.",
        });
      }

      console.log(`📁 Received file: ${req.file.originalname} (${req.file.size} bytes)`);

      // Process the file
      const bulkUploadService = new BulkUploadService();
      const result = await bulkUploadService.processBulkUpload(
        req.file.buffer,
        req.file.originalname
      );

      // Return results
      return res.status(200).json({
        success: true,
        message: `Processed ${result.total} records: ${result.successful} successful, ${result.failed} failed`,
        data: result,
      });
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to process bulk upload",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

/**
 * GET /api/bulk-upload/template
 * Download CSV template for bulk upload
 */
router.get("/template", authenticateToken, (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Create CSV template
    const template = `Type,Name,Email,Phone,Admission Number,Branch,Batch,Role,Department
student,John Doe,john.doe@college.edu,+91-9876543210,CS-2026-001,Computer Science,2026,student,
student,Jane Smith,jane.smith@college.edu,+91-9876543211,EC-2026-002,Electronics,2026,student,
employee,Dr. Robert Brown,robert.brown@college.edu,+91-9876543212,,,2024,faculty,Computer Science
employee,Prof. Sarah Davis,sarah.davis@college.edu,+91-9876543213,,,2024,faculty,Electronics`;

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=bulk-upload-template.csv");
    
    return res.send(template);
  } catch (error: any) {
    console.error("Template download error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate template",
    });
  }
});

export default router;
