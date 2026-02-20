"use client";

import { useState } from "react";
import {
  Search,
  Folder,
  FileText,
  Download,
  Eye,
  Filter,
  ChevronRight,
  ChevronDown,
  User,
  Calendar,
  Building,
  CheckCircle,
  Clock,
  XCircle,
  FolderOpen,
  ArrowLeft,
} from "lucide-react";

type DocumentStatus = "verified" | "pending" | "rejected";

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  status: DocumentStatus;
  size: string;
  url: string;
}

interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  branch: string;
  year: string;
  email: string;
  documents: Document[];
}

// Mock data - simulating hundreds of students
const mockStudents: Student[] = [
  // Computer Science students
  ...Array.from({ length: 150 }, (_, i) => ({
    id: `cs-${i + 1}`,
    name: `CS Student ${i + 1}`,
    admissionNumber: `CS-2026-${String(i + 1).padStart(3, "0")}`,
    branch: "Computer Science",
    year: "2026",
    email: `cs.student${i + 1}@college.edu`,
    documents: [
      { id: `d-cs-${i}-1`, name: "10th Marksheet", type: "Academic", uploadedAt: "2024-01-15", status: i % 3 === 0 ? "pending" : "verified" as DocumentStatus, size: "2.3 MB", url: "#" },
      { id: `d-cs-${i}-2`, name: "12th Marksheet", type: "Academic", uploadedAt: "2024-01-15", status: "verified" as DocumentStatus, size: "2.1 MB", url: "#" },
    ],
  })),
  // Electronics students
  ...Array.from({ length: 120 }, (_, i) => ({
    id: `ec-${i + 1}`,
    name: `EC Student ${i + 1}`,
    admissionNumber: `EC-2026-${String(i + 1).padStart(3, "0")}`,
    branch: "Electronics",
    year: "2026",
    email: `ec.student${i + 1}@college.edu`,
    documents: [
      { id: `d-ec-${i}-1`, name: "10th Marksheet", type: "Academic", uploadedAt: "2024-01-17", status: "verified" as DocumentStatus, size: "2.4 MB", url: "#" },
    ],
  })),
  // Mechanical students
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `me-${i + 1}`,
    name: `ME Student ${i + 1}`,
    admissionNumber: `ME-2026-${String(i + 1).padStart(3, "0")}`,
    branch: "Mechanical",
    year: "2026",
    email: `me.student${i + 1}@college.edu`,
    documents: [
      { id: `d-me-${i}-1`, name: "10th Marksheet", type: "Academic", uploadedAt: "2024-01-18", status: "verified" as DocumentStatus, size: "2.6 MB", url: "#" },
    ],
  })),
  // Civil students
  ...Array.from({ length: 80 }, (_, i) => ({
    id: `ce-${i + 1}`,
    name: `CE Student ${i + 1}`,
    admissionNumber: `CE-2026-${String(i + 1).padStart(3, "0")}`,
    branch: "Civil",
    year: "2026",
    email: `ce.student${i + 1}@college.edu`,
    documents: [
      { id: `d-ce-${i}-1`, name: "10th Marksheet", type: "Academic", uploadedAt: "2024-01-19", status: "verified" as DocumentStatus, size: "2.2 MB", url: "#" },
    ],
  })),
  // Electrical students
  ...Array.from({ length: 90 }, (_, i) => ({
    id: `ee-${i + 1}`,
    name: `EE Student ${i + 1}`,
    admissionNumber: `EE-2026-${String(i + 1).padStart(3, "0")}`,
    branch: "Electrical",
    year: "2026",
    email: `ee.student${i + 1}@college.edu`,
    documents: [
      { id: `d-ee-${i}-1`, name: "10th Marksheet", type: "Academic", uploadedAt: "2024-01-20", status: "verified" as DocumentStatus, size: "2.5 MB", url: "#" },
    ],
  })),
];

const statusConfig = {
  verified: { label: "Verified", icon: CheckCircle, color: "text-chart-1", bg: "bg-chart-1/10" },
  pending: { label: "Pending", icon: Clock, color: "text-status-yellow", bg: "bg-status-yellow" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

export default function AdminDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<"folders" | "student">("folders");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const branches = ["all", ...new Set(mockStudents.map((s) => s.branch))];
  const years = ["all", ...new Set(mockStudents.map((s) => s.year))];

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch = searchQuery === "" || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === "all" || student.branch === selectedBranch;
    const matchesYear = selectedYear === "all" || student.year === selectedYear;
    return matchesSearch && matchesBranch && matchesYear;
  });

  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const key = `${student.branch}-${student.year}`;
    if (!acc[key]) acc[key] = { branch: student.branch, year: student.year, students: [] };
    acc[key].students.push(student);
    return acc;
  }, {} as Record<string, { branch: string; year: string; students: Student[] }>);

  const toggleFolder = (key: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-mesh p-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Student Documents</h1>
          <p className="text-sm text-muted-foreground">Click on folders to view students</p>
        </div>

        <div className="mb-4 rounded-2xl border border-border/50 bg-card p-3 neu-flat">
          <div className="grid gap-2 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search by name or ID..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full rounded-full border border-border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" 
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select 
                value={selectedBranch} 
                onChange={(e) => setSelectedBranch(e.target.value)} 
                className="w-full rounded-full border border-border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none appearance-none cursor-pointer"
              >
                {branches.map((b) => <option key={b} value={b}>{b === "all" ? "All Branches" : b}</option>)}
              </select>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)} 
                className="w-full rounded-full border border-border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none appearance-none cursor-pointer"
              >
                {years.map((y) => <option key={y} value={y}>{y === "all" ? "All Years" : `Batch ${y}`}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>{filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} found</span>
          </div>
        </div>

        {viewMode === "folders" && (
          <div className="space-y-2">
            {Object.entries(groupedStudents).length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-card p-8 text-center neu-flat">
                <FolderOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No students found</p>
              </div>
            ) : (
              Object.entries(groupedStudents).map(([key, group]) => {
                const isExpanded = expandedFolders.has(key);
                const verifiedCount = group.students.reduce((acc, s) => 
                  acc + s.documents.filter(d => d.status === "verified").length, 0
                );
                const totalDocs = group.students.reduce((acc, s) => acc + s.documents.length, 0);

                return (
                  <div key={key} className="rounded-2xl border border-border/50 bg-card neu-flat overflow-hidden">
                    {/* Folder Header - Clickable */}
                    <button
                      onClick={() => toggleFolder(key)}
                      className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                          {isExpanded ? (
                            <FolderOpen className="h-5 w-5 text-chart-1" />
                          ) : (
                            <Folder className="h-5 w-5 text-chart-1" />
                          )}
                        </div>
                        <div className="text-left">
                          <h2 className="text-base font-bold flex items-center gap-2">
                            {group.branch} - Batch {group.year}
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {group.students.length} students • {verifiedCount}/{totalDocs} docs verified
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Click to {isExpanded ? "close" : "open"}</p>
                      </div>
                    </button>

                    {/* Student List - Only shown when expanded */}
                    {isExpanded && (
                      <div className="border-t border-border/50 bg-background/50 p-3">
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                          {group.students.map((student) => {
                            const verified = student.documents.filter((d) => d.status === "verified").length;
                            return (
                              <button 
                                key={student.id} 
                                onClick={() => { 
                                  setSelectedStudent(student); 
                                  setViewMode("student"); 
                                }} 
                                className="group flex items-center gap-2 rounded-xl border border-border/50 bg-background p-2 text-left transition-all hover:border-chart-1 hover:bg-chart-1/5"
                              >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                  <User className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-semibold">{student.name}</p>
                                  <p className="text-xs text-muted-foreground">{student.admissionNumber}</p>
                                  <p className="text-xs text-chart-1">{verified}/{student.documents.length}</p>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {viewMode === "student" && selectedStudent && (
          <div className="space-y-3">
            <button 
              onClick={() => { 
                setSelectedStudent(null); 
                setViewMode("folders"); 
              }} 
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />Back to folders
            </button>
            <div className="rounded-2xl border border-border/50 bg-card p-3 neu-flat">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/10">
                    <User className="h-5 w-5 text-chart-1" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{selectedStudent.name}</h2>
                    <p className="text-xs text-muted-foreground">{selectedStudent.admissionNumber}</p>
                    <div className="mt-1 flex gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />{selectedStudent.branch}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />Batch {selectedStudent.year}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Documents</p>
                  <p className="text-xl font-bold">{selectedStudent.documents.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-card p-3 neu-flat">
              <h3 className="mb-2 text-sm font-semibold">Documents</h3>
              <div className="space-y-2">
                {selectedStudent.documents.map((doc) => {
                  const statusInfo = statusConfig[doc.status];
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div key={doc.id} className="flex items-center gap-2 rounded-xl border border-border/50 bg-background p-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.type} • {doc.size} • {doc.uploadedAt}</p>
                      </div>
                      <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />{statusInfo.label}
                      </div>
                      <div className="flex gap-1">
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary hover:text-foreground">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary hover:text-foreground">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
