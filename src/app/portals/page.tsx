"use client";

import { ChatInterface } from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface PortalTask {
  id: string;
  label: string;
  isDone: boolean;
}

interface Portal {
  id: string;
  name: string;
  description: string;
  url: string;
  tasks: PortalTask[];
  icon: any;
  color: string;
}

export default function PortalsPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");

  const handleAskAI = (query: string) => {
    setChatQuery(query);
    setChatOpen(true);
  };

  const [portals, setPortals] = useState<Portal[]>([
    {
      id: "abc",
      name: "ABC (Academic Bank of Credits)",
      description: "Link your academic credits to a unique ID.",
      url: "https://www.abc.gov.in/",
      icon: ShieldCheck,
      color: "text-blue-600",
      tasks: [
        { id: "abc-1", label: "Create ABC ID via DigiLocker", isDone: false },
        {
          id: "abc-2",
          label: "Select 'University' from Institution list",
          isDone: false,
        },
        {
          id: "abc-3",
          label: "Enter Admission Year & Identity Value",
          isDone: false,
        },
        {
          id: "abc-4",
          label: "Submit to generate 12-digit ABC ID",
          isDone: false,
        },
        {
          id: "abc-5",
          label: "Link ABC ID to College ERP Profile",
          isDone: false,
        },
      ],
    },
    {
      id: "parakh",
      name: "PARAKH Portal",
      description: "AICTE's student learning assessment portal.",
      url: "https://parakh.aicte-india.org/",
      icon: ShieldCheck,
      color: "text-green-600",
      tasks: [
        {
          id: "parakh-1",
          label: "Register as Student on PARAKH",
          isDone: false,
        },
        {
          id: "parakh-2",
          label: "Verify Email and Mobile Number",
          isDone: false,
        },
        {
          id: "parakh-3",
          label: "Complete 'SLA' (Student Learning Assessment)",
          isDone: false,
        },
        { id: "parakh-4", label: "Download Assessment Report", isDone: false },
        { id: "parakh-5", label: "Update Skills Profile", isDone: false },
      ],
    },
    {
      id: "nptel",
      name: "NPTEL / SWAYAM",
      description: "Massive Open Online Courses for credit transfer.",
      url: "https://nptel.ac.in/",
      icon: ShieldCheck,
      color: "text-orange-600",
      tasks: [
        {
          id: "nptel-1",
          label: "Create Account with College Email",
          isDone: false,
        },
        {
          id: "nptel-2",
          label: "Browse & Join Semester Courses",
          isDone: false,
        },
        {
          id: "nptel-3",
          label: "Watch Weekly Lectures & Submit Assignments",
          isDone: false,
        },
        {
          id: "nptel-4",
          label: "Register for Proctored Exam (Pay Fee)",
          isDone: false,
        },
        { id: "nptel-5", label: "Download Hall Ticket", isDone: false },
      ],
    },
    {
      id: "digilocker",
      name: "DigiLocker",
      description: "Secure cloud storage for official documents.",
      url: "https://www.digilocker.gov.in/",
      icon: ShieldCheck,
      color: "text-indigo-600",
      tasks: [
        { id: "digi-1", label: "Sign Up using Aadhaar Number", isDone: false },
        { id: "digi-2", label: "Verify OTP sent to Mobile", isDone: false },
        {
          id: "digi-3",
          label: "Fetch Class X & XII Marksheets",
          isDone: false,
        },
        { id: "digi-4", label: "Fetch PAN Verification Record", isDone: false },
        {
          id: "digi-5",
          label: "Upload Driving License (Optional)",
          isDone: false,
        },
      ],
    },
  ]);

  const toggleTask = (portalId: string, taskId: string) => {
    setPortals((prev) =>
      prev.map((portal) => {
        if (portal.id === portalId) {
          return {
            ...portal,
            tasks: portal.tasks.map((task) =>
              task.id === taskId ? { ...task, isDone: !task.isDone } : task,
            ),
          };
        }
        return portal;
      }),
    );
  };

  const calculateProgress = (tasks: PortalTask[]) => {
    const done = tasks.filter((t) => t.isDone).length;
    return (done / tasks.length) * 100;
  };

  return (
    <div className="space-y-6 w-full mx-auto p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Government Portals
        </h1>
        <p className="text-muted-foreground">
          Track your registration and tasks for mandatory government education
          portals.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {portals.map((portal) => {
          const progress = calculateProgress(portal.tasks);
          return (
            <Card key={portal.id} className="relative overflow-hidden">
              <div
                className={cn(
                  "absolute top-0 left-0 w-1 h-full",
                  portal.color.replace("text", "bg"),
                )}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <portal.icon className={cn("h-5 w-5", portal.color)} />
                    <CardTitle className="text-lg">{portal.name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 h-8 text-xs"
                      onClick={() =>
                        handleAskAI(`How do I register for ${portal.name}?`)
                      }
                    >
                      <Sparkles className="h-3 w-3 text-primary" />
                      Ask AI
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a
                        href={portal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                <CardDescription>{portal.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Progress value={progress} className="h-2" />
                  <span className="w-12 text-right">
                    {Math.round(progress)}%
                  </span>
                </div>

                <div className="space-y-2">
                  {portal.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer border",
                        task.isDone
                          ? "bg-secondary/50 border-transparent"
                          : "hover:bg-accent border-transparent",
                      )}
                      onClick={() => toggleTask(portal.id, task.id)}
                    >
                      <div
                        className={cn(
                          "shrink-0 text-primary transition-all",
                          task.isDone ? "scale-110" : "scale-100 opacity-50",
                        )}
                      >
                        {task.isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          task.isDone && "text-muted-foreground line-through",
                        )}
                      >
                        {task.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="w-[900px] sm:max-w-[900px] p-0">
          <ChatInterface initialMessage={chatQuery} className="h-full" />
        </SheetContent>
      </Sheet>
    </div>
  );
}
