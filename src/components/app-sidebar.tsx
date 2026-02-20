"use client";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import {
  AlertOctagon,
  BarChart3,
  BookOpen,
  CalendarDays,
  FileCheck,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Moon,
  ScanLine,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const [userRole, setUserRole] = useState<string | null>(null);

  const isAdminPage = pathname?.startsWith("/admin");

  let theme = "light";
  let toggleTheme = () => {};

  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    toggleTheme = themeContext.toggleTheme;
  } catch (e) {
    // Theme provider not available yet
  }

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
  }, []);

  const essentials = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "Chat with P.A.L.", icon: MessageCircle },
    { href: "/documents", label: "Documents", icon: FileCheck },
    { href: "/academics", label: "Academics", icon: BookOpen },
    { href: "/tribe", label: "Tribe", icon: Users },
    { href: "/wellness", label: "Wellness", icon: Heart },
  ];

  const smartFeatures = [
    {
      href: "/dashboard",
      label: "Project Matcher",
      icon: Sparkles,
      color: "text-indigo-500",
      id: "project-matcher",
    },
    {
      href: "/dashboard",
      label: "RPG Quests",
      icon: Trophy,
      color: "text-yellow-500",
      id: "rpg-quests",
    },
    {
      href: "/documents",
      label: "Identity Vault",
      icon: ScanLine,
      color: "text-blue-500",
      id: "identity-vault",
    },
    {
      href: "/academics",
      label: "Calendar Sync",
      icon: CalendarDays,
      color: "text-green-500",
      id: "calendar-sync",
    },
    {
      href: "/portals",
      label: "Gov Portals",
      icon: Shield,
      color: "text-red-500",
      id: "gov-portals",
    },
  ];

  const adminItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "queue", label: "Verification Queue", icon: FileCheck },
    { id: "funnel", label: "Funnel Analysis", icon: BarChart3 },
    { id: "sentiment", label: "Sentiment Monitor", icon: AlertOctagon },
    { id: "knowledge", label: "Knowledge Base", icon: Upload },
    { id: "guide", label: "User Guide", icon: BookOpen },
    { id: "chat", label: "AI Assistant", icon: MessageCircle },
  ];

  const adminPages = [
    { href: "/admin/documents", label: "Student Documents", icon: FileCheck },
    { href: "/admin/bulk-upload", label: "Bulk Upload", icon: Users },
  ];

  if (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname?.startsWith("/signup/")) {
    return null;
  }

  return (
    <aside className="hidden w-64 flex-col border-r border-border/40 bg-card/50 backdrop-blur-xl md:flex sticky top-0 h-screen">
      <div className="p-6">
        <Link
          href={isAdminPage ? "/admin" : "/"}
          className="flex items-center gap-3"
        >
          <Image
            src={
              theme === "dark" ? "/pal-logo-dark.svg" : "/pal-logo-light.svg"
            }
            alt="P.A.L. Logo"
            width={56}
            height={56}
            className="h-14 w-14"
          />
          <span className="text-lg font-bold tracking-tight">P.A.L.</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <nav className="grid gap-1 px-4">
          {isAdminPage ? (
            <>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Admin Controls
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin?tab=${item.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    activeTab === item.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              
              <div className="mt-6 px-2 py-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                User Management
              </div>
              {adminPages.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </>
          ) : (
            <>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Essentials
              </div>
              {essentials.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}

              <div className="mt-6 px-2 py-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Smart Features
              </div>
              {smartFeatures.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground group",
                    "text-muted-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "p-1 rounded bg-secondary group-hover:bg-background transition-colors",
                      item.color,
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  {item.label}
                </Link>
              ))}

              {userRole === "admin" && (
                <>
                  <div className="mt-6 px-2 py-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin
                  </div>
                  <Link
                    href="/admin"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname === "/admin"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <Shield className="h-5 w-5 text-red-500" />
                    Admin Dashboard
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-border/40">
        <nav className="grid gap-1">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground w-full text-left"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === "/settings"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground",
            )}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive w-full text-left"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </nav>
      </div>
    </aside>
  );
}
