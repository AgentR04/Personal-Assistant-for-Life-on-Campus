import axios from "axios";
import { supabaseAdmin } from "../config/database";
import DocumentService from "../services/DocumentService";
import { documentProcessingQueue } from "../services/QueueService";
import { logger } from "../utils/logger";

// Process document jobs
documentProcessingQueue.process(async (job) => {
  const { documentId, fileUrl } = job.data;

  logger.info(`Processing document ${documentId} from queue`);

  try {
    let buffer: Buffer;
    let mimeType: string;

    if (fileUrl.includes("utfs.io") || fileUrl.includes("uploadthing.com")) {
      // Download from UploadThing using axios directly
      logger.info(`Downloading file from UploadThing URL: ${fileUrl}`);
      const response = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });
      buffer = Buffer.from(response.data);
      mimeType = response.headers["content-type"] || "application/octet-stream";
    } else {
      // Download file from Supabase Storage
      const fileName = fileUrl.split("/documents/")[1];
      const { data: fileData, error } = await supabaseAdmin.storage
        .from("documents")
        .download(fileName);

      if (error || !fileData) {
        throw new Error(
          `Failed to download file from Supabase: ${error?.message}`,
        );
      }

      // Convert blob to buffer
      buffer = Buffer.from(await fileData.arrayBuffer());
      mimeType = fileData.type;
    }

    // Process document (this will update status and extract data)
    await (DocumentService as any).processDocument(
      documentId,
      buffer,
      mimeType,
      job.data.documentType,
    );

    return { success: true, documentId };
  } catch (error) {
    logger.error(
      `Error in document processing worker for ${documentId}:`,
      error,
    );
    throw error;
  }
});

logger.info("Document processing worker started");
