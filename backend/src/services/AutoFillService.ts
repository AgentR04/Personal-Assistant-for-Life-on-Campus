import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// ─── Data Models ─────────────────────────────────────────────────────────────

export interface IdentityVault {
  fullName: string;
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  fatherName: string;
  extractedAt: string;
  confidence: number;
  rawExtraction?: Record<string, string>;
}

export interface FormSchema {
  formType: string;
  formTitle: string;
  fields: Array<{
    fieldId: string;
    label: string;
    required: boolean;
    vaultMapping: keyof IdentityVault | null;
  }>;
}

// ─── Form Schemas ────────────────────────────────────────────────────────────

const FORM_SCHEMAS: Record<string, FormSchema> = {
  library_form: {
    formType: "library_form",
    formTitle: "Library Registration Form",
    fields: [
      {
        fieldId: "full_name",
        label: "Full Name",
        required: true,
        vaultMapping: "fullName",
      },
      {
        fieldId: "date_of_birth",
        label: "Date of Birth",
        required: true,
        vaultMapping: "dateOfBirth",
      },
      {
        fieldId: "local_address",
        label: "Local Address",
        required: true,
        vaultMapping: "address",
      },
    ],
  },
  hostel_form: {
    formType: "hostel_form",
    formTitle: "Hostel Allotment Form",
    fields: [
      {
        fieldId: "full_name",
        label: "Full Name",
        required: true,
        vaultMapping: "fullName",
      },
      {
        fieldId: "father_name",
        label: "Father's Name",
        required: true,
        vaultMapping: "fatherName",
      },
      {
        fieldId: "dob",
        label: "Date of Birth",
        required: true,
        vaultMapping: "dateOfBirth",
      },
      {
        fieldId: "blood_group",
        label: "Blood Group",
        required: true,
        vaultMapping: "bloodGroup",
      },
      {
        fieldId: "permanent_address",
        label: "Permanent Address",
        required: true,
        vaultMapping: "address",
      },
    ],
  },
  medical_form: {
    formType: "medical_form",
    formTitle: "Medical Registration Form",
    fields: [
      {
        fieldId: "patient_name",
        label: "Patient Name",
        required: true,
        vaultMapping: "fullName",
      },
      {
        fieldId: "dob",
        label: "Date of Birth",
        required: true,
        vaultMapping: "dateOfBirth",
      },
      {
        fieldId: "blood_group",
        label: "Blood Group",
        required: true,
        vaultMapping: "bloodGroup",
      },
      {
        fieldId: "emergency_contact_name",
        label: "Emergency Contact Name",
        required: true,
        vaultMapping: "fatherName",
      },
    ],
  },
};

// ─── In-memory vault store ───────────────────────────────────────────────────
const vaultStore = new Map<string, IdentityVault>();

// ─── Service ─────────────────────────────────────────────────────────────────

class AutoFillService {
  /**
   * Extract identity data from an admission letter image using Gemini Vision
   */
  async extractIdentityVault(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<IdentityVault> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `You are an expert document data extractor. Extract the following 5 fields from this admission letter / document image.
Return ONLY a valid JSON object with these exact keys:
{
  "fullName": "student's full name",
  "dateOfBirth": "DD/MM/YYYY format",
  "bloodGroup": "e.g. O+, A-, B+",
  "address": "full address",
  "fatherName": "father's / guardian's name"
}

If a field is not visible, use "Not found" as the value. No markdown, no explanation — just JSON.`;

      const imagePart = {
        inlineData: {
          mimeType,
          data: imageBuffer.toString("base64"),
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text().trim();

      // Parse JSON from response
      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```/g, "")
        .trim();
      const extracted = JSON.parse(cleaned);

      const vault: IdentityVault = {
        fullName: extracted.fullName || "Not found",
        dateOfBirth: extracted.dateOfBirth || "Not found",
        bloodGroup: extracted.bloodGroup || "Not found",
        address: extracted.address || "Not found",
        fatherName: extracted.fatherName || "Not found",
        extractedAt: new Date().toISOString(),
        confidence: this.calculateConfidence(extracted),
        rawExtraction: extracted,
      };

      logger.info(
        `Identity Vault extracted: ${vault.fullName} (confidence: ${vault.confidence})`,
      );
      return vault;
    } catch (error) {
      logger.error("Error extracting identity vault:", error);
      // Return mock data for development
      return this.getMockVault();
    }
  }

  /**
   * Calculate extraction confidence based on how many fields were found
   */
  private calculateConfidence(extracted: Record<string, string>): number {
    const fields = [
      "fullName",
      "dateOfBirth",
      "bloodGroup",
      "address",
      "fatherName",
    ];
    const foundCount = fields.filter(
      (f) =>
        extracted[f] && extracted[f] !== "Not found" && extracted[f].length > 0,
    ).length;
    return Math.round((foundCount / fields.length) * 100);
  }

  /**
   * Get mock vault for development/testing
   */
  private getMockVault(): IdentityVault {
    return {
      fullName: "Arsh Verma",
      dateOfBirth: "15/06/2007",
      bloodGroup: "O+",
      address: "42 MG Road, Sector 14, Gurugram, Haryana 122001",
      fatherName: "Rajesh Verma",
      extractedAt: new Date().toISOString(),
      confidence: 100,
      rawExtraction: { source: "mock_data" },
    };
  }

  /**
   * Store vault for a user
   */
  storeVault(userId: string, vault: IdentityVault): void {
    vaultStore.set(userId, vault);
    logger.info(`Identity Vault stored for user ${userId}`);
  }

  /**
   * Get stored vault for a user
   */
  getVault(userId: string): IdentityVault | null {
    return vaultStore.get(userId) || null;
  }

  /**
   * Map Identity Vault data to a target form schema
   */
  mapToForm(
    vault: IdentityVault,
    formType: string,
  ): {
    formTitle: string;
    formType: string;
    filledFields: Array<{
      fieldId: string;
      label: string;
      value: string;
      autoFilled: boolean;
    }>;
    completionRate: number;
  } {
    const schema = FORM_SCHEMAS[formType];
    if (!schema) {
      throw new Error(
        `Unknown form type: "${formType}". Available: ${Object.keys(FORM_SCHEMAS).join(", ")}`,
      );
    }

    const filledFields = schema.fields.map((field) => {
      let value = "";
      let autoFilled = false;

      if (field.vaultMapping && vault[field.vaultMapping]) {
        const vaultValue = vault[field.vaultMapping];
        if (typeof vaultValue === "string" && vaultValue !== "Not found") {
          value = vaultValue;
          autoFilled = true;
        }
      }

      return {
        fieldId: field.fieldId,
        label: field.label,
        value,
        autoFilled,
      };
    });

    const filledCount = filledFields.filter((f) => f.autoFilled).length;
    const completionRate = Math.round(
      (filledCount / filledFields.length) * 100,
    );

    return {
      formTitle: schema.formTitle,
      formType: schema.formType,
      filledFields,
      completionRate,
    };
  }

  /**
   * Generate conversational approval prompt
   */
  getApprovalPrompt(vault: IdentityVault, formType: string): string {
    const schema = FORM_SCHEMAS[formType];
    if (!schema) return "Form type not found.";

    const mapped = this.mapToForm(vault, formType);
    const fieldSummary = mapped.filledFields
      .filter((f) => f.autoFilled)
      .map((f) => `• **${f.label}:** ${f.value}`)
      .join("\n");

    return `📋 I've auto-filled the **${schema.formTitle}** using your Identity Vault!\n\nHere's what I've filled in:\n${fieldSummary}\n\n✅ **${mapped.completionRate}%** of the form is ready.\n\nReply **"Approve"** to submit, or **"Edit"** to make changes.`;
  }

  /**
   * Get available form types
   */
  getAvailableForms(): Array<{
    formType: string;
    formTitle: string;
    fieldCount: number;
  }> {
    return Object.values(FORM_SCHEMAS).map((schema) => ({
      formType: schema.formType,
      formTitle: schema.formTitle,
      fieldCount: schema.fields.length,
    }));
  }
}

export default new AutoFillService();
