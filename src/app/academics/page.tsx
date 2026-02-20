"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";
import { Clock, Download, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export default function AcademicsPage() {
  const [timetable, setTimetable] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await api.calendar.getTimetable();
        if (res.data.success) {
          setTimetable(res.data.data.timetable);
        }
      } catch (error) {
        console.error("Failed to fetch timetable:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  const handleExport = () => {
    // Replace with actual student ID from auth context if available, or let backend extract from token
    // For now, passing a placeholder or token is handled by the hook
    api.calendar.downloadICS("current-user");
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="student">
        <div className="gradient-mesh min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthGuard>
    );
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="gradient-mesh min-h-screen px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Academics
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your class schedule, assignments, and academic resources.
            </p>
          </div>
          <Button
            onClick={handleExport}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Sync to Calendar (.ics)
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          {days.map((day) => {
            const dayClasses = timetable?.[day] || [];
            const isToday =
              new Date().toLocaleDateString("en-US", { weekday: "long" }) ===
              day;

            return (
              <div
                key={day}
                className={`space-y-4 ${isToday ? "scale-105" : ""}`}
              >
                <h3
                  className={`font-semibold text-lg flex items-center gap-2 ${isToday ? "text-indigo-600" : "text-muted-foreground"}`}
                >
                  {day}{" "}
                  {isToday && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </h3>

                {dayClasses.length > 0 ? (
                  dayClasses.map((cls: any, idx: number) => (
                    <Card
                      key={idx}
                      className={`border-l-4 ${
                        cls.type === "lab"
                          ? "border-l-pink-500"
                          : cls.type === "tutorial"
                            ? "border-l-purple-500"
                            : "border-l-indigo-500"
                      } shadow-sm hover:shadow-md transition-shadow`}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-sm leading-tight">
                            {cls.subject}
                          </div>
                          <div className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                            {cls.code}
                          </div>
                        </div>
                        <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {cls.startTime} - {cls.endTime}
                        </div>
                        <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {cls.location}
                        </div>
                        <div className="text-xs pt-1 border-t border-border/50 mt-2 text-muted-foreground grid grid-cols-2">
                          <span>
                            {cls.type === "lab"
                              ? "🔬 Lab"
                              : cls.type === "tutorial"
                                ? "📝 Tutorial"
                                : "📚 Lecture"}
                          </span>
                          <span className="text-right truncate">
                            {cls.instructor}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border/60 text-center text-sm text-muted-foreground bg-card/30">
                    No classes
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
