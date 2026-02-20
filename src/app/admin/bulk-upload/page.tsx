"use client";

import { useState } from "react";
import { Upload, Download, CheckCircle, XCircle, AlertCircle, Users, FileSpreadsheet, Loader2 } from "lucide-react";

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      alert("Please upload a valid Excel (.xlsx, .xls) or CSV file");
      return;
    }

    setFile(selectedFile);
    setResults(null);
  };

  const processUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append("file", file);

      // Get auth token
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in to upload files");
        setUploading(false);
        return;
      }

      // Call backend API
      const response = await fetch("http://localhost:3001/api/v1/bulk-upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      // Set results from backend
      setResults(data.data);
      setUploading(false);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "Failed to process upload");
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const template = `Type,Name,Email,Phone,Admission Number,Branch,Batch,Role,Department
student,John Doe,john.doe@college.edu,+91-9876543210,CS-2026-001,Computer Science,2026,student,
student,Jane Smith,jane.smith@college.edu,+91-9876543211,EC-2026-002,Electronics,2026,student,
employee,Dr. Robert Brown,robert.brown@college.edu,+91-9876543212,,,2024,faculty,Computer Science
employee,Prof. Sarah Davis,sarah.davis@college.edu,+91-9876543213,,,2024,faculty,Electronics`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-upload-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-mesh p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Bulk User Upload</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Upload Excel or CSV files to create multiple student and employee profiles automatically
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-8 rounded-3xl border border-border/50 bg-card p-6 neu-flat">
          <h2 className="mb-4 text-xl font-bold">How to Use</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chart-1/20 text-xs font-bold">
                1
              </div>
              <p>Download the template file and fill in your data</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chart-2/20 text-xs font-bold">
                2
              </div>
              <p>Upload the completed file (Excel .xlsx, .xls or CSV format)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chart-3/20 text-xs font-bold">
                3
              </div>
              <p>Review the results and fix any errors if needed</p>
            </div>
          </div>

          <button
            onClick={downloadTemplate}
            className="mt-6 flex items-center gap-2 rounded-full bg-foreground px-6 py-3 font-semibold text-background transition-all hover:scale-105"
          >
            <Download className="h-5 w-5" />
            Download Template
          </button>
        </div>

        {/* Upload Area */}
        <div className="mb-8 rounded-3xl border border-border/50 bg-card p-8 neu-flat">
          <h2 className="mb-6 text-xl font-bold">Upload File</h2>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
              dragActive
                ? "border-foreground bg-secondary"
                : "border-border hover:border-foreground/50"
            }`}
          >
            <FileSpreadsheet className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            
            {!file ? (
              <>
                <p className="mb-2 text-lg font-semibold">
                  Drag and drop your file here
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  or click to browse
                </p>
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-secondary px-6 py-3 font-semibold transition-all hover:bg-secondary/80"
                >
                  <Upload className="h-5 w-5" />
                  Choose File
                </label>
                <p className="mt-4 text-xs text-muted-foreground">
                  Supported formats: .xlsx, .xls, .csv (Max 10MB)
                </p>
              </>
            ) : (
              <>
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-chart-1" />
                <p className="mb-2 text-lg font-semibold">{file.name}</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={processUpload}
                    disabled={uploading}
                    className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 font-semibold text-background transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        Upload & Process
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setFile(null);
                      setResults(null);
                    }}
                    disabled={uploading}
                    className="rounded-full border border-border px-6 py-3 font-semibold transition-all hover:bg-secondary disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-chart-1/10 to-chart-3/10 p-8 neu-flat">
              <h2 className="mb-6 text-2xl font-bold">Upload Results</h2>
              
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/50 bg-background p-6 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-chart-1" />
                  <div className="text-3xl font-bold">{results.total}</div>
                  <div className="text-sm text-muted-foreground">Total Records</div>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background p-6 text-center">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-chart-1" />
                  <div className="text-3xl font-bold text-chart-1">{results.successful}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background p-6 text-center">
                  <XCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
                  <div className="text-3xl font-bold text-destructive">{results.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/50 bg-background p-4">
                  <div className="text-2xl font-bold">{results.students}</div>
                  <div className="text-sm text-muted-foreground">Students Created</div>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background p-4">
                  <div className="text-2xl font-bold">{results.employees}</div>
                  <div className="text-sm text-muted-foreground">Employees Created</div>
                </div>
              </div>
            </div>

            {/* Errors */}
            {results.errors.length > 0 && (
              <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 neu-flat">
                <div className="mb-4 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                  <h2 className="text-xl font-bold">Errors Found</h2>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  The following records could not be processed. Please fix these errors and upload again.
                </p>

                <div className="space-y-3">
                  {results.errors.map((error: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border/50 bg-background p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">Row {error.row}: {error.name}</div>
                          <div className="mt-1 text-sm text-destructive">{error.error}</div>
                        </div>
                        <XCircle className="h-5 w-5 text-destructive" />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const errorCSV = `Row,Name,Error\n${results.errors.map((e: any) => `${e.row},${e.name},${e.error}`).join('\n')}`;
                    const blob = new Blob([errorCSV], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'upload-errors.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="mt-6 flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold transition-all hover:bg-secondary"
                >
                  <Download className="h-5 w-5" />
                  Download Error Report
                </button>
              </div>
            )}

            {/* Success Message */}
            {results.failed === 0 && (
              <div className="rounded-3xl border border-chart-1/30 bg-chart-1/10 p-8 text-center neu-flat">
                <CheckCircle className="mx-auto mb-4 h-16 w-16 text-chart-1" />
                <h2 className="mb-2 text-2xl font-bold">All Records Processed Successfully!</h2>
                <p className="text-muted-foreground">
                  {results.total} profiles have been created in the database.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Field Reference */}
        <div className="mt-8 rounded-3xl border border-border/50 bg-card p-6 neu-flat">
          <h2 className="mb-4 text-xl font-bold">Field Reference</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left font-semibold">Field Name</th>
                  <th className="pb-3 text-left font-semibold">Required</th>
                  <th className="pb-3 text-left font-semibold">Format</th>
                  <th className="pb-3 text-left font-semibold">Example</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-3">Type</td>
                  <td className="py-3">Yes</td>
                  <td className="py-3">student or employee</td>
                  <td className="py-3">student</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3">Name</td>
                  <td className="py-3">Yes</td>
                  <td className="py-3">Full name</td>
                  <td className="py-3">John Doe</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3">Email</td>
                  <td className="py-3">Yes</td>
                  <td className="py-3">Valid email</td>
                  <td className="py-3">john.doe@college.edu</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3">Phone</td>
                  <td className="py-3">Yes</td>
                  <td className="py-3">+91-XXXXXXXXXX</td>
                  <td className="py-3">+91-9876543210</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3">Admission Number</td>
                  <td className="py-3">For students</td>
                  <td className="py-3">XX-YYYY-NNN</td>
                  <td className="py-3">CS-2026-001</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3">Branch</td>
                  <td className="py-3">For students</td>
                  <td className="py-3">Branch name</td>
                  <td className="py-3">Computer Science</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3">Batch</td>
                  <td className="py-3">For students</td>
                  <td className="py-3">YYYY</td>
                  <td className="py-3">2026</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-3">Role</td>
                  <td className="py-3">Yes</td>
                  <td className="py-3">student, faculty, staff</td>
                  <td className="py-3">student</td>
                </tr>
                <tr>
                  <td className="py-3">Department</td>
                  <td className="py-3">For employees</td>
                  <td className="py-3">Department name</td>
                  <td className="py-3">Computer Science</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
