"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "student" | "admin";
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("userRole");
      const testMode = localStorage.getItem("testMode");

      console.log("AuthGuard check:", {
        pathname,
        hasToken: !!token,
        tokenPrefix: token?.substring(0, 15),
        userRole,
        testMode,
        requiredRole,
      });

      // Public routes
      const publicRoutes = ["/", "/login", "/test-auth"];
      if (publicRoutes.includes(pathname)) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Allow test mode tokens
      const isTestMode =
        testMode === "true" || (token || "").startsWith("test-token-");

      // Check if user is authenticated
      if (!token && !isTestMode) {
        console.log("No token found, redirecting to login");
        router.push("/login");
        return;
      }

      // Check role-based access (skip in test mode)
      if (!isTestMode && requiredRole && userRole !== requiredRole) {
        console.log("Role mismatch:", { userRole, requiredRole });
        if (userRole === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        return;
      }

      console.log("Auth check passed!", { isTestMode });
      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router, requiredRole]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
