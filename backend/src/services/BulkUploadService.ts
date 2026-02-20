import { GoogleGenerativeAI } from "@google/generative-ai";
import * as XLSX from "xlsx";
import { pool } from "../config/database";
import bcrypt from "bcrypt";

interface ParsedUser {
  type: "student" | "employee";
  name: string;
  email: string;
  phone: string;
  admissionNumber?: string;
  branch?: string;
  batch?: string;
  role: "student" | "faculty" | "staff";
  department?: string;
}

interface ValidationError {
  row: number;
  name: string;
  error: string;
}

interface ProcessingResult {
  total: number;
  successful: number;
  failed: number;
  students: number;
  employees: number;
  errors: ValidationError[];
  createdUsers: any[];
}

export class BulkUploadService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  }

  /**
   * Main function to process bulk upload
   * This is what gets called when admin clicks "Upload & Process"
   */
  async processBulkUpload(fileBuffer: Buffer, filename: string): Promise<ProcessingResult> {
    console.log(`📊 Starting bulk upload processing for: ${filename}`);

    // Step 1: Parse Excel/CSV file
    const rawData = this.parseFile(fileBuffer, filename);
    console.log(`✓ Parsed ${rawData.length} rows from file`);

    // Step 2: Use AI to clean and validate data
    const cleanedData = await this.aiCleanAndValidate(rawData);
    console.log(`✓ AI cleaned and validated data`);

    // Step 3: Process each user and insert into database
    const result = await this.processUsers(cleanedData);
    console.log(`✓ Processing complete: ${result.successful} successful, ${result.failed} failed`);

    return result;
  }

  /**
   * Step 1: Parse Excel or CSV file into raw data
   */
  private parseFile(fileBuffer: Buffer, filename: string): any[] {
    try {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const data = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // Convert dates and numbers to strings
        defval: "", // Default value for empty cells
      });

      return data;
    } catch (error) {
      console.error("Error parsing file:", error);
      throw new Error("Failed to parse file. Please ensure it's a valid Excel or CSV file.");
    }
  }

  /**
   * Step 2: AI cleans and validates the data
   * This is where the magic happens!
   */
  private async aiCleanAndValidate(rawData: any[]): Promise<ParsedUser[]> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a data cleaning AI for a college management system. 
Your job is to analyze this Excel data and convert it into a standardized format.

IMPORTANT RULES:
1. Map column names intelligently (e.g., "Student Name", "Full Name", "Name" → name)
2. Clean phone numbers to format: +91-XXXXXXXXXX
3. Validate email addresses
4. Determine if each person is a student or employee based on available fields
5. Fix common typos and formatting issues
6. Return ONLY valid JSON array, no markdown or explanation

Expected output format:
[
  {
    "type": "student" or "employee",
    "name": "Full Name",
    "email": "email@college.edu",
    "phone": "+91-9876543210",
    "admissionNumber": "CS-2026-001" (only for students),
    "branch": "Computer Science" (only for students),
    "batch": "2026" (only for students),
    "role": "student" or "faculty" or "staff",
    "department": "Computer Science" (only for employees)
  }
]

Raw data to process:
${JSON.stringify(rawData, null, 2)}

Return the cleaned JSON array:`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Extract JSON from response (AI might wrap it in markdown)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("AI did not return valid JSON");
      }

      const cleanedData = JSON.parse(jsonMatch[0]);
      return cleanedData;
    } catch (error) {
      console.error("AI cleaning failed:", error);
      // Fallback: manual parsing if AI fails
      return this.manualParse(rawData);
    }
  }

  /**
   * Fallback manual parsing if AI fails
   */
  private manualParse(rawData: any[]): ParsedUser[] {
    return rawData.map((row) => {
      // Try to find name field (case-insensitive)
      const nameField = Object.keys(row).find(
        (key) => key.toLowerCase().includes("name")
      );
      const emailField = Object.keys(row).find(
        (key) => key.toLowerCase().includes("email")
      );
      const phoneField = Object.keys(row).find(
        (key) => key.toLowerCase().includes("phone")
      );
      const typeField = Object.keys(row).find(
        (key) => key.toLowerCase().includes("type")
      );

      const type = row[typeField || "Type"]?.toLowerCase() === "student" ? "student" : "employee";

      return {
        type,
        name: row[nameField || "Name"] || "",
        email: row[emailField || "Email"] || "",
        phone: row[phoneField || "Phone"] || "",
        admissionNumber: row["Admission Number"] || row["AdmissionNumber"],
        branch: row["Branch"],
        batch: row["Batch"],
        role: row["Role"]?.toLowerCase() || type,
        department: row["Department"],
      };
    });
  }

  /**
   * Step 3: Validate and insert users into database
   */
  private async processUsers(users: ParsedUser[]): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      total: users.length,
      successful: 0,
      failed: 0,
      students: 0,
      employees: 0,
      errors: [],
      createdUsers: [],
    };

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const rowNumber = i + 2; // +2 because Excel starts at 1 and has header row

      try {
        // Validate required fields
        const validation = this.validateUser(user);
        if (!validation.valid) {
          result.errors.push({
            row: rowNumber,
            name: user.name || "Unknown",
            error: validation.error || "Validation failed",
          });
          result.failed++;
          continue;
        }

        // Check for duplicates
        const duplicate = await this.checkDuplicate(user);
        if (duplicate) {
          result.errors.push({
            row: rowNumber,
            name: user.name,
            error: `Duplicate ${duplicate} already exists in database`,
          });
          result.failed++;
          continue;
        }

        // Create user in database
        const createdUser = await this.createUser(user);
        result.createdUsers.push(createdUser);
        result.successful++;

        if (user.type === "student") {
          result.students++;
        } else {
          result.employees++;
        }
      } catch (error: any) {
        console.error(`Error processing row ${rowNumber}:`, error);
        result.errors.push({
          row: rowNumber,
          name: user.name || "Unknown",
          error: error.message || "Database insertion failed",
        });
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Validate user data
   */
  private validateUser(user: ParsedUser): { valid: boolean; error?: string } {
    if (!user.name || user.name.trim().length === 0) {
      return { valid: false, error: "Name is required" };
    }

    if (!user.email || !this.isValidEmail(user.email)) {
      return { valid: false, error: "Valid email is required" };
    }

    if (!user.phone || !this.isValidPhone(user.phone)) {
      return { valid: false, error: "Valid phone number is required" };
    }

    if (user.type === "student") {
      if (!user.admissionNumber) {
        return { valid: false, error: "Admission number is required for students" };
      }
      if (!user.branch) {
        return { valid: false, error: "Branch is required for students" };
      }
      if (!user.batch) {
        return { valid: false, error: "Batch is required for students" };
      }
    }

    if (user.type === "employee") {
      if (!user.department) {
        return { valid: false, error: "Department is required for employees" };
      }
    }

    return { valid: true };
  }

  /**
   * Check for duplicate email or admission number
   */
  private async checkDuplicate(user: ParsedUser): Promise<string | null> {
    const client = await pool.connect();
    try {
      // Check email
      const emailCheck = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [user.email]
      );
      if (emailCheck.rows.length > 0) {
        return "email";
      }

      // Check admission number for students
      if (user.type === "student" && user.admissionNumber) {
        const admissionCheck = await client.query(
          "SELECT id FROM users WHERE admission_number = $1",
          [user.admissionNumber]
        );
        if (admissionCheck.rows.length > 0) {
          return "admission number";
        }
      }

      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Create user in database
   */
  private async createUser(user: ParsedUser): Promise<any> {
    const client = await pool.connect();
    try {
      // Generate default password (can be changed later)
      const defaultPassword = "Welcome@123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const query = `
        INSERT INTO users (
          name, 
          email, 
          password, 
          phone, 
          role, 
          admission_number, 
          branch, 
          batch, 
          department,
          onboarding_status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING id, name, email, role, admission_number, branch, batch, department
      `;

      const values = [
        user.name,
        user.email,
        hashedPassword,
        user.phone,
        user.role,
        user.admissionNumber || null,
        user.branch || null,
        user.batch || null,
        user.department || null,
        user.type === "student" ? "registered" : "completed",
      ];

      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Utility: Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Utility: Validate phone format
   */
  private isValidPhone(phone: string): boolean {
    // Accept formats: +91-9876543210, 9876543210, +919876543210
    const phoneRegex = /^(\+91[-\s]?)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  }
}
