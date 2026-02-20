import { Request, Response, Router } from "express";
import { body, validationResult } from "express-validator";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import AutoFillService from "../services/AutoFillService";
import { logger } from "../utils/logger";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * POST /api/v1/autofill/extract
 * Upload an admission letter and extract identity data
 */
router.post(
  "/extract",
  authenticate,
  upload.single("document"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      // Use uploaded file or mock data
      let vault;
      if (req.file) {
        vault = await AutoFillService.extractIdentityVault(
          req.file.buffer,
          req.file.mimetype,
        );
      } else {
        // Mock extraction for testing without file upload
        logger.info("No file uploaded — using mock Identity Vault");
        vault = await AutoFillService.extractIdentityVault(
          Buffer.from("mock"),
          "image/jpeg",
        );
      }

      // Store vault for the user
      AutoFillService.storeVault(req.user.userId, vault);

      res.json({
        success: true,
        message: "Identity Vault created successfully",
        data: { vault },
      });
    } catch (error) {
      logger.error("Extract identity error:", error);
      res.status(500).json({ error: "Failed to extract identity data" });
    }
  },
);

/**
 * GET /api/v1/autofill/vault
 * Get the stored Identity Vault for the authenticated user
 */
router.get(
  "/vault",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const vault = AutoFillService.getVault(req.user.userId);
      if (!vault) {
        res
          .status(404)
          .json({ error: "No Identity Vault found. Upload a document first." });
        return;
      }

      res.json({ success: true, data: { vault } });
    } catch (error) {
      logger.error("Get vault error:", error);
      res.status(500).json({ error: "Failed to get vault" });
    }
  },
);

/**
 * POST /api/v1/autofill/fill
 * Auto-fill a target form using the Identity Vault
 */
router.post(
  "/fill",
  authenticate,
  [
    body("formType")
      .trim()
      .notEmpty()
      .withMessage(
        "Form type is required (e.g. library_form, hostel_form, medical_form)",
      ),
  ],
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

      const vault = AutoFillService.getVault(req.user.userId);
      if (!vault) {
        res.status(404).json({
          error:
            "No Identity Vault found. Upload a document first via /extract.",
        });
        return;
      }

      const { formType } = req.body;

      const filledForm = AutoFillService.mapToForm(vault, formType);
      const approvalPrompt = AutoFillService.getApprovalPrompt(vault, formType);

      res.json({
        success: true,
        data: {
          form: filledForm,
          approvalPrompt,
        },
      });
    } catch (error: any) {
      logger.error("Auto-fill error:", error);
      res
        .status(400)
        .json({ error: error.message || "Failed to auto-fill form" });
    }
  },
);

/**
 * GET /api/v1/autofill/forms
 * Get available form types
 */
router.get(
  "/forms",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const forms = AutoFillService.getAvailableForms();
      res.json({ success: true, data: { forms } });
    } catch (error) {
      logger.error("Get forms error:", error);
      res.status(500).json({ error: "Failed to get forms" });
    }
  },
);

export default router;
