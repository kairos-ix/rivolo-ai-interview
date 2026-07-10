"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  fallbackPath?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermissions,
  fallbackPath = "/dashboard",
}: ProtectedRouteProps) {
  const { user, isLoading, isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isLoggedIn || !user) {
      router.replace("/login");
      return;
    }

    let isAuthorized = true;

    // Check roles if specified
    if (allowedRoles && allowedRoles.length > 0) {
      if (!user.role || !allowedRoles.includes(user.role)) {
        isAuthorized = false;
      }
    }

    // Check permissions if specified (and if user is not admin)
    if (isAuthorized && requiredPermissions && requiredPermissions.length > 0) {
      if (user.role !== "admin") {
        const hasAllPermissions = requiredPermissions.every((p) =>
          user.permissions?.includes(p)
        );
        if (!hasAllPermissions) {
          isAuthorized = false;
        }
      }
    }

    if (!isAuthorized) {
      router.replace(fallbackPath);
    }
  }, [user, isLoading, isLoggedIn, allowedRoles, requiredPermissions, fallbackPath, router]);

  // Show nothing or a loader while checking auth state
  if (isLoading || !isLoggedIn || !user) {
    return (
      <div className="flex-1 bg-background py-8 md:py-12 px-4 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-9 w-64 bg-muted rounded-xl animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded-lg animate-pulse" />
          <div className="h-96 bg-muted rounded-2xl animate-pulse mt-8" />
        </div>
      </div>
    );
  }

  // Double check authorization before rendering children
  let isAuthorized = true;
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user.role || !allowedRoles.includes(user.role)) {
      isAuthorized = false;
    }
  }
  if (isAuthorized && requiredPermissions && requiredPermissions.length > 0) {
    if (user.role !== "admin") {
      const hasAllPermissions = requiredPermissions.every((p) =>
        user.permissions?.includes(p)
      );
      if (!hasAllPermissions) {
        isAuthorized = false;
      }
    }
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
