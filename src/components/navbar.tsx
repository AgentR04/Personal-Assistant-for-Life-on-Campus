"use client";

import { useTheme } from "@/components/theme-provider";
import {
  BookOpen,
  FileCheck,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Settings,
  Shield,
  Sun,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const publicLinks: { href: string; label: string; icon: any }[] = [
  // Removed Home link - landing page is not needed after login
];

const studentLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/academics", label: "Academics", icon: BookOpen },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/documents", label: "Documents", icon: FileCheck },
  { href: "/tribe", label: "Tribe", icon: Users },
  { href: "/wellness", label: "Wellness", icon: Heart },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "Admin Dashboard", icon: Shield },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    console.log("Navbar - Auth check:", { token: !!token, role, pathname });
    setIsAuthenticated(!!token);
    setUserRole(role);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    setUserRole(null);
    router.push("/");
  };

  const navLinks = isAuthenticated
    ? userRole === "admin"
      ? adminLinks
      : studentLinks
    : publicLinks;

  console.log("Navbar - Computed links:", {
    isAuthenticated,
    userRole,
    linksCount: navLinks.length,
    links: navLinks.map((l) => l.label),
  });

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
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

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {/* Links moved to AppSidebar */}

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
          )}

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-all hover:scale-[1.02]"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/50 bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
