"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  Building2,
  Users,
  Mail,
  Sparkles,
  ArrowRight,
  Download,
} from "lucide-react";

export default function AdminSetupPage() {
  const router = useRouter();
  const [collegeData, setCollegeData] = useState<any>(null);
  const [setupProgress, setSetupProgress] = useState(0);

  useEffect(() => {
    // Load college data from localStorage
    const data = localStorage.getItem("superAdminData");
    if (!data) {
      router.push("/signup/college");
      return;
    }

    setCollegeData(JSON.parse(data));

    // Simulate setup progress
    const interval = setInterval(() => {
      setSetupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [router]);

  if (!collegeData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {setupProgress < 100 ? (
          // Setup in Progress
          <div className="rounded-3xl border border-border/50 bg-card p-12 text-center neu-flat">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-chart-1/20">
                <Sparkles className="h-10 w-10 animate-pulse text-chart-1" />
              </div>
            </div>

            <h1 className="mb-4 text-3xl font-bold">Setting Up Your Account</h1>
            <p className="mb-8 text-muted-foreground">
              We're configuring P.A.L. for {collegeData.collegeName}...
            </p>

            <div className="mb-4">
              <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-gradient-to-r from-chart-1 to-chart-3 transition-all duration-300"
                  style={{ width: `${setupProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {setupProgress}% Complete
              </p>
            </div>

            <div className="space-y-2 text-left text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-chart-1" />
                Creating database schema...
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-chart-1" />
                Setting up AI models...
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-chart-1" />
                Configuring admin dashboard...
              </div>
              <div className="flex items-center gap-2">
                {setupProgress >= 100 ? (
                  <CheckCircle className="h-4 w-4 text-chart-1" />
                ) : (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-chart-1 border-t-transparent" />
                )}
                Finalizing setup...
              </div>
            </div>
          </div>
        ) : (
          // Setup Complete
          <div className="space-y-6">
            {/* Success Message */}
            <div className="rounded-3xl border border-chart-1/30 bg-chart-1/10 p-12 text-center neu-flat">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-chart-1">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              </div>

              <h1 className="mb-4 text-3xl font-bold">
                🎉 Welcome to P.A.L.!
              </h1>
              <p className="text-lg text-muted-foreground">
                Your account has been successfully created
              </p>
            </div>

            {/* Account Details */}
            <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
              <h2 className="mb-6 text-xl font-bold">Account Details</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-xl bg-secondary/30 p-4">
                  <Building2 className="h-6 w-6 shrink-0 text-chart-1" />
                  <div>
                    <div className="font-semibold">Institution</div>
                    <div className="text-sm text-muted-foreground">
                      {collegeData.collegeName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {collegeData.collegeCity}, {collegeData.collegeState}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl bg-secondary/30 p-4">
                  <Users className="h-6 w-6 shrink-0 text-chart-2" />
                  <div>
                    <div className="font-semibold">Super Admin</div>
                    <div className="text-sm text-muted-foreground">
                      {collegeData.adminName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {collegeData.adminEmail}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl bg-secondary/30 p-4">
                  <Sparkles className="h-6 w-6 shrink-0 text-chart-3" />
                  <div>
                    <div className="font-semibold">Plan</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {collegeData.plan} Plan
                    </div>
                    <div className="text-xs text-chart-1">
                      Free trial active until{" "}
                      {new Date(collegeData.trialEndsAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
              <h2 className="mb-6 text-xl font-bold">Next Steps</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                    1
                  </div>
                  <div>
                    <div className="font-semibold">Upload Student Data</div>
                    <div className="text-sm text-muted-foreground">
                      Use our AI-powered bulk upload to create student profiles from Excel
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                    2
                  </div>
                  <div>
                    <div className="font-semibold">Customize Settings</div>
                    <div className="text-sm text-muted-foreground">
                      Configure college-specific rules, deadlines, and workflows
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                    3
                  </div>
                  <div>
                    <div className="font-semibold">Invite Admin Team</div>
                    <div className="text-sm text-muted-foreground">
                      Add other administrators to help manage the platform
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
              <h2 className="mb-6 text-xl font-bold">Helpful Resources</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-xl border border-border p-4 transition-all hover:bg-secondary"
                >
                  <Download className="h-5 w-5 text-chart-1" />
                  <div>
                    <div className="font-semibold text-sm">Quick Start Guide</div>
                    <div className="text-xs text-muted-foreground">
                      PDF download
                    </div>
                  </div>
                </a>

                <a
                  href="#"
                  className="flex items-center gap-3 rounded-xl border border-border p-4 transition-all hover:bg-secondary"
                >
                  <Mail className="h-5 w-5 text-chart-2" />
                  <div>
                    <div className="font-semibold text-sm">Contact Support</div>
                    <div className="text-xs text-muted-foreground">
                      24/7 assistance
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-4">
              <Link
                href="/admin"
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-foreground font-semibold text-background transition-all hover:scale-[1.02]"
              >
                Go to Admin Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
