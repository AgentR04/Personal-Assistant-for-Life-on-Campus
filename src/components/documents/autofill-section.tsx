"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Check, Loader2, RefreshCw, Upload, Wand2 } from "lucide-react";
import { useState } from "react";

export function AutoFillSection() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [vault, setVault] = useState<any>(null);
  const [selectedForm, setSelectedForm] = useState("library_form");
  const [filling, setFilling] = useState(false);
  const [filledForm, setFilledForm] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("document", file);

      const res = await api.autofill.extract(formData);
      if (res.data.success) {
        setVault(res.data.data.vault);
      }
    } catch (error) {
      console.error("Extraction failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleAutoFill = async () => {
    setFilling(true);
    try {
      const res = await api.autofill.fillForm(selectedForm);
      if (res.data.success) {
        setFilledForm(res.data.data);
      }
    } catch (error) {
      console.error("Auto-fill failed:", error);
    } finally {
      setFilling(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left Column: Vault Setup */}
      <div className="space-y-6">
        <Card className="border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Wand2 className="h-5 w-5" /> Identity Vault Setup
            </CardTitle>
            <CardDescription>
              Upload your admission letter once. We'll use Gemini Vision to
              extract your details securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!vault ? (
              <div className="flex flex-col gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="admission-letter">
                    Admission Letter / ID Proof
                  </Label>
                  <Input
                    id="admission-letter"
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                  />
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Extract Identity Data
                </Button>
              </div>
            ) : (
              <div className="rounded-lg bg-background p-4 border border-border">
                <div className="flex items-center gap-2 mb-3 text-green-600 font-medium">
                  <Check className="h-4 w-4" /> Vault Active
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{vault.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DOB:</span>
                    <span className="font-medium">{vault.dateOfBirth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="text-blue-600 font-bold">
                      {vault.confidence}%
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVault(null)}
                  className="w-full mt-4"
                >
                  <RefreshCw className="mr-2 h-3 w-3" /> Reset Vault
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Auto-Fill Demo */}
      <div className="space-y-6">
        <Card
          className={cn(
            "transition-opacity",
            !vault && "opacity-50 pointer-events-none",
          )}
        >
          <CardHeader>
            <CardTitle>Zero-Form Auto-Fill</CardTitle>
            <CardDescription>Select a form to fill instantly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedForm} onValueChange={setSelectedForm}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="library_form">
                    Library Registration
                  </SelectItem>
                  <SelectItem value="hostel_form">Hostel Allotment</SelectItem>
                  <SelectItem value="medical_form">Medical Record</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleAutoFill}
                disabled={filling}
                className="flex-1"
              >
                {filling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Auto-Fill Now"
                )}
              </Button>
            </div>

            {filledForm && (
              <div className="rounded-lg border border-border p-4 bg-card animate-in zoom-in-50 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold">{filledForm.form.formTitle}</h4>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    {filledForm.form.completionRate}% Completed
                  </span>
                </div>
                <div className="space-y-3">
                  {filledForm.form.filledFields.map((field: any) => (
                    <div
                      key={field.fieldId}
                      className="grid grid-cols-3 gap-2 text-sm items-center"
                    >
                      <label className="text-muted-foreground col-span-1">
                        {field.label}
                      </label>
                      <Input
                        value={field.value}
                        readOnly
                        className={cn(
                          "col-span-2 h-8",
                          field.autoFilled &&
                            "bg-blue-50/50 border-blue-200 text-blue-800",
                        )}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded text-xs italic text-muted-foreground border border-border/50">
                  {filledForm.approvalPrompt.split("\n")[0]}...
                </div>
                <Button className="w-full mt-2 bg-green-600 hover:bg-green-700 h-8 text-xs">
                  Approve & Submit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
