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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
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
