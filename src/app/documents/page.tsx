"use client";

import { AutoFillSection } from "@/components/documents/autofill-section";
import api from "@/lib/api";
import { UploadDropzone } from "@/lib/uploadthing";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileImage,
  FileText,
  Loader2,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

type DocStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "approved"
  | "review"
  | "rejected";

type Document = {
  id: string;
  name: string;
  type: string;
  size: string;
  status: DocStatus;
  confidence?: number;
  extractedData?: Record<string, any>;
  reason?: string;
  url?: string;
};

const statusConfig = {
  idle: {
    label: "Ready",
    color: "text-muted-foreground",
    bg: "bg-secondary",
    icon: FileImage,
  },
  uploading: {
    label: "Uploading...",
    color: "text-chart-1",
    bg: "bg-chart-1/10",
    icon: Loader2,
  },
  processing: {
    label: "AI Scanning...",
    color: "text-chart-1",
    bg: "bg-chart-1/10",
    icon: Loader2,
  },
  approved: {
    label: "Approved",
    color: "status-green",
    bg: "bg-status-green",
    icon: CheckCircle2,
  },
  review: {
    label: "Needs Review",
    color: "status-yellow",
    bg: "bg-status-yellow",
    icon: AlertTriangle,
  },
  rejected: {
    label: "Rejected",
    color: "status-red",
    bg: "bg-status-red",
    icon: XCircle,
  },
};

const mapBackendStatus = (status: string): DocStatus => {
  const statusMap: Record<string, DocStatus> = {
    pending: "processing",
    green: "approved",
    yellow: "review",
    red: "rejected",
  };
  return statusMap[status] || "processing";
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  // const [dragActive, setDragActive] = useState(false); // Unused with Uploadthing component
  const [loading, setLoading] = useState(true);

  // Drag handlers removed as UploadDropzone handles this internally

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.documents.getAll();
      console.log("Fetch documents response:", response);

      // Try both possible response structures
      const docsData =
        response?.data?.documents || response?.data?.data?.documents || [];

      if (!Array.isArray(docsData)) {
        console.error("Invalid documents data:", docsData);
        setDocuments([]);
        return;
      }

      const docs = docsData.map((doc: any) => ({
        id: doc.id || `temp-${Date.now()}`,
        name: doc.fileName || doc.name || "Unknown",
        type: doc.documentType || doc.type || "other",
        size: formatFileSize(doc.fileSize || 0),
        status: mapBackendStatus(
          doc.verificationStatus || doc.status || "processing",
        ),
        confidence: doc.confidence,
        extractedData: doc.extractedData,
        reason: doc.rejectionReason || doc.validationIssues?.join(", "),
        url: doc.original_file_url || doc.url,
      }));
      setDocuments(docs);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const removeDoc = async (id: string) => {
    try {
      await api.documents.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  if (loading) {
    return (
      <div className="gradient-mesh min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="gradient-mesh min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Smart-Scan Documents
          </h1>
          <p className="mt-2 text-muted-foreground">
            Upload your documents and let Vision AI verify them instantly.
          </p>
        </div>

        {/* PII notice */}
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 neu-flat">
          <Shield className="h-5 w-5 shrink-0 text-chart-1" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Privacy Protected:
            </span>{" "}
            Sensitive information (Aadhar/SSN numbers) is automatically masked
            in all AI responses. Your documents are stored securely.
          </p>
        </div>

        {/* Upload zone */}
        <div className="mb-10">
          <UploadDropzone
            endpoint="documentUploader"
            onClientUploadComplete={async (res) => {
              console.log("Files: ", res);
              if (res) {
                // Register each uploaded file with backend
                await Promise.all(
                  res.map(async (file) => {
                    const type = file.name.endsWith(".pdf") ? "other" : "other"; // Could ask user for type, defaulting to 'other' for now, except maybe matching filename

                    let docType = "other";
                    if (file.name.toLowerCase().includes("mark"))
                      docType = "marksheet_10th";
                    else if (
                      file.name.toLowerCase().includes("id") ||
                      file.name.toLowerCase().includes("aadhar")
                    )
                      docType = "id_proof";

                    try {
                      await api.documents.register({
                        documentType: docType,
                        fileUrl: file.url,
                        fileName: file.name,
                        fileSize: file.size,
                      });
                    } catch (e) {
                      console.error(
                        "Failed to register document with backend",
                        e,
                      );
                    }
                  }),
                );

                // Trigger a refresh from backend
                await fetchDocuments();
              }
            }}
            onUploadError={(error: Error) => {
              // Do something with the error.
              alert(`ERROR! ${error.message}`);
            }}
            appearance={{
              container:
                "rounded-3xl border-2 border-dashed border-border/50 bg-card/50 p-12 text-center transition-all hover:border-border neu-pressed",
              label: "text-lg font-semibold text-foreground",
              allowedContent: "text-sm text-muted-foreground",
              button:
                "mt-6 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:scale-[1.02]",
            }}
          />
        </div>

        {/* Auto-Fill Section */}
        <div className="mb-12">
          <AutoFillSection />
        </div>

        {/* Document list */}
        <div>
          <h2 className="mb-6 text-xl font-semibold tracking-tight">
            Your Documents ({documents.length})
          </h2>
          <div className="space-y-4">
            {documents.map((doc) => {
              const config = statusConfig[doc.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-border/50 bg-card p-5 transition-all neu-flat"
                >
                  <div className="flex items-start gap-4">
                    {/* File icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                      {doc.name.endsWith(".pdf") ? (
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <FileImage className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium truncate">{doc.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.color}`}
                        >
                          <StatusIcon
                            className={`h-3.5 w-3.5 ${
                              doc.status === "uploading" ||
                              doc.status === "processing"
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                          {config.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {doc.type} — {doc.size}
                        {doc.confidence !== undefined &&
                          ` — AI Confidence: ${Math.round(doc.confidence * 100)}%`}
                      </p>

                      {/* Mismatch reason */}
                      {doc.reason && (
                        <div className="mt-3 rounded-xl bg-status-yellow p-3">
                          <p className="text-sm status-yellow font-medium">
                            <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                            {doc.reason}
                          </p>
                        </div>
                      )}

                      {/* Extracted data */}
                      {doc.extractedData &&
                        Object.keys(doc.extractedData).length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl bg-secondary/50 p-4 sm:grid-cols-3">
                            {Object.entries(doc.extractedData).map(
                              ([key, val]) => (
                                <div key={key}>
                                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                    {key.replace(/_/g, " ")}
                                  </p>
                                  <div className="text-sm font-medium">
                                    {typeof val === "object" && val !== null ? (
                                      <pre className="whitespace-pre-wrap text-xs">
                                        {JSON.stringify(val, null, 2)}
                                      </pre>
                                    ) : (
                                      <span>{String(val)}</span>
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() =>
                          doc.url && window.open(doc.url, "_blank")
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeDoc(doc.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
