import { pool } from "../config/database";
import path from "path";
import fs from "fs/promises";

interface DocumentUpload {
  userId: string;
  documentType: string;
  fileName: string;
  fileBuffer: Buffer;
  status: "verified" | "pending" | "rejected";
}

interface StudentFolder {
  branch: string;
  year: string;
  admissionNumber: string;
  studentName: string;
}

export class DocumentOrganizationService {
  private baseStoragePath: string;

  constructor() {
    // Base path for document storage
    // In production, this would be S3, Azure Blob, or similar
    this.baseStoragePath = process.env.DOCUMENT_STORAGE_PATH || "./storage/documents";
  }

  /**
   * Get folder path for a student
   * Structure: /storage/documents/{branch}/{year}/{admissionNumber}/
   * Example: /storage/documents/Computer Science/2026/CS-2026-001/
   */
  private async getStudentFolderPath(userId: string): Promise<string> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          u.admission_number,
          u.branch,
          u.batch as year,
          u.name
        FROM users u
        WHERE u.id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Student not found");
      }

      const student = result.rows[0];
      
      // Create folder structure: branch/year/admissionNumber
      const folderPath = path.join(
        this.baseStoragePath,
        this.sanitizeFolderName(student.branch),
        student.year,
        this.sanitizeFolderName(student.admission_number)
      );

      return folderPath;
    } finally {
      client.release();
    }
  }

  /**
   * Sanitize folder names (remove special characters)
   */
  private sanitizeFolderName(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_]/g, "_");
  }

  /**
   * Ensure folder exists, create if not
   */
  private async ensureFolderExists(folderPath: string): Promise<void> {
    try {
      await fs.access(folderPath);
    } catch {
      // Folder doesn't exist, create it
      await fs.mkdir(folderPath, { recursive: true });
    }
  }

  /**
   * Upload document to student's folder
   * Called when document is uploaded and verified
   */
  async uploadDocument(upload: DocumentUpload): Promise<string> {
    try {
      // Get student's folder path
      const folderPath = await this.getStudentFolderPath(upload.userId);

      // Ensure folder exists
      await this.ensureFolderExists(folderPath);

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const sanitizedFileName = this.sanitizeFolderName(upload.fileName);
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = path.join(folderPath, fileName);

      // Save file
      await fs.writeFile(filePath, upload.fileBuffer);

      // Update database with file path
      const client = await pool.connect();
      try {
        await client.query(
          `UPDATE documents 
          SET file_path = $1, storage_location = $2
          WHERE user_id = $3 AND document_type = $4`,
          [filePath, "local", upload.userId, upload.documentType]
        );
      } finally {
        client.release();
      }

      console.log(`✓ Document uploaded: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  }

  /**
   * Get all documents for a student
   */
  async getStudentDocuments(userId: string): Promise<any[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          d.id,
          d.document_type,
          d.file_path,
          d.verification_status as status,
          d.created_at as uploaded_at,
          d.file_size
        FROM documents d
        WHERE d.user_id = $1
        ORDER BY d.created_at DESC`,
        [userId]
      );

      return result.rows.map((doc) => ({
        id: doc.id,
        name: doc.document_type,
        type: this.getDocumentCategory(doc.document_type),
        uploadedAt: doc.uploaded_at,
        status: doc.status,
        size: this.formatFileSize(doc.file_size),
        path: doc.file_path,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Search students and their documents
   */
  async searchStudents(filters: {
    searchQuery?: string;
    branch?: string;
    year?: string;
  }): Promise<any[]> {
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          u.id,
          u.name,
          u.admission_number,
          u.branch,
          u.batch as year,
          u.email,
          COUNT(d.id) as document_count,
          COUNT(CASE WHEN d.verification_status = 'verified' THEN 1 END) as verified_count
        FROM users u
        LEFT JOIN documents d ON u.id = d.user_id
        WHERE u.role = 'student'
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // Add search filter
      if (filters.searchQuery) {
        query += ` AND (
          u.name ILIKE $${paramIndex} OR 
          u.admission_number ILIKE $${paramIndex} OR 
          u.email ILIKE $${paramIndex}
        )`;
        params.push(`%${filters.searchQuery}%`);
        paramIndex++;
      }

      // Add branch filter
      if (filters.branch && filters.branch !== "all") {
        query += ` AND u.branch = $${paramIndex}`;
        params.push(filters.branch);
        paramIndex++;
      }

      // Add year filter
      if (filters.year && filters.year !== "all") {
        query += ` AND u.batch = $${paramIndex}`;
        params.push(filters.year);
        paramIndex++;
      }

      query += ` GROUP BY u.id, u.name, u.admission_number, u.branch, u.batch, u.email
                 ORDER BY u.branch, u.batch, u.name`;

      const result = await client.query(query, params);

      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        admissionNumber: row.admission_number,
        branch: row.branch,
        year: row.year,
        email: row.email,
        documentCount: parseInt(row.document_count),
        verifiedCount: parseInt(row.verified_count),
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get folder structure (branches and years)
   */
  async getFolderStructure(): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          branch,
          batch as year,
          COUNT(*) as student_count
        FROM users
        WHERE role = 'student'
        GROUP BY branch, batch
        ORDER BY branch, batch
      `);

      const structure: Record<string, any> = {};

      result.rows.forEach((row) => {
        if (!structure[row.branch]) {
          structure[row.branch] = {};
        }
        structure[row.branch][row.year] = {
          studentCount: parseInt(row.student_count),
        };
      });

      return structure;
    } finally {
      client.release();
    }
  }

  /**
   * Download document
   */
  async downloadDocument(documentId: string, userId: string): Promise<Buffer> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT file_path FROM documents WHERE id = $1 AND user_id = $2`,
        [documentId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Document not found");
      }

      const filePath = result.rows[0].file_path;
      const fileBuffer = await fs.readFile(filePath);

      return fileBuffer;
    } finally {
      client.release();
    }
  }

  /**
   * Helper: Get document category
   */
  private getDocumentCategory(documentType: string): string {
    const categories: Record<string, string> = {
      "10th Marksheet": "Academic",
      "12th Marksheet": "Academic",
      "Degree Certificate": "Academic",
      "Aadhar Card": "Identity",
      "PAN Card": "Identity",
      "Passport": "Identity",
      "Photo": "Identity",
      "Medical Certificate": "Medical",
      "Transfer Certificate": "Academic",
    };

    return categories[documentType] || "Other";
  }

  /**
   * Helper: Format file size
   */
  private formatFileSize(bytes: number): string {
    if (!bytes) return "0 B";
    
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Move document to verified folder when status changes
   */
  async moveDocumentOnVerification(documentId: string): Promise<void> {
    const client = await pool.connect();
    try {
      // Get document info
      const result = await client.query(
        `SELECT d.*, u.admission_number, u.branch, u.batch
        FROM documents d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = $1`,
        [documentId]
      );

      if (result.rows.length === 0) {
        throw new Error("Document not found");
      }

      const doc = result.rows[0];

      // If document is verified, ensure it's in the correct folder
      if (doc.verification_status === "verified" && doc.file_path) {
        const correctFolderPath = await this.getStudentFolderPath(doc.user_id);
        const currentFilePath = doc.file_path;
        const fileName = path.basename(currentFilePath);
        const newFilePath = path.join(correctFolderPath, fileName);

        // If file is not in correct location, move it
        if (currentFilePath !== newFilePath) {
          await this.ensureFolderExists(correctFolderPath);
          await fs.rename(currentFilePath, newFilePath);

          // Update database
          await client.query(
            `UPDATE documents SET file_path = $1 WHERE id = $2`,
            [newFilePath, documentId]
          );

          console.log(`✓ Document moved to verified folder: ${newFilePath}`);
        }
      }
    } finally {
      client.release();
    }
  }
}
