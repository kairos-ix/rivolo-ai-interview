"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, Suspense } from "react";
import api from "@/lib/axios";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing reset token.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password });
      setStatus("success");
      setMessage(response.data.message || "Password has been successfully reset.");
      
      // Auto redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.response?.data?.message || "Token is invalid or has expired.");
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-6">
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
          Missing reset token in the URL. Please request a new password reset link.
        </div>
        <Link href="/forgot-password">
          <Button className="w-full rounded-full bg-primary hover:opacity-90 text-white font-semibold">
            Request New Link
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {status === "success" ? (
        <div className="text-center space-y-6">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm">
            {message}
          </div>
          <p className="text-xs text-muted-foreground">Redirecting to login...</p>
          <Link href="/login">
            <Button className="w-full rounded-full bg-primary hover:opacity-90 text-white font-semibold">
              Go to Login Now
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === "error" && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg text-center">
              {message}
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold mb-2 text-foreground"
            >
              New Password
            </label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="rounded-lg"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold mb-2 text-foreground"
            >
              Confirm New Password
            </label>
            <Input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="rounded-lg"
            />
          </div>

          <Button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-primary hover:opacity-90 text-white font-semibold rounded-full py-2"
          >
            {status === "loading" ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/favicon.svg" alt="Logo" className="w-12 h-12 rounded-xl shadow-md" />
        </div>

        <Card className="p-8 border border-border/50 shadow-lg">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
              Set New Password
            </h1>
            <p className="text-center text-muted-foreground text-sm">
              Please enter your new password below.
            </p>
          </div>

          <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
