"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import React, { useState } from "react";
import api from "@/lib/axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await api.post("/auth/forgot-password", { email });
      setStatus("success");
      setMessage(response.data.message || "Password reset link sent to your email.");
      
      // If backend returns a preview URL (like Ethereal), log it for development convenience
      if (response.data.previewUrl) {
        console.log("Email Preview URL:", response.data.previewUrl);
        // We also show it in the UI temporarily for the "Easy Way" implementation
        setMessage(`Email sent! For testing, view it here: ${response.data.previewUrl}`);
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

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
              Reset Password
            </h1>
            <p className="text-center text-muted-foreground text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {status === "success" ? (
            <div className="text-center space-y-6">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm">
                {message.includes("http") ? (
                  <>
                    <p className="mb-2 font-semibold">Testing Mode Active:</p>
                    <a href={message.split("here: ")[1]} target="_blank" rel="noreferrer" className="underline hover:text-green-500">
                      Click here to view the simulated email
                    </a>
                  </>
                ) : (
                  message
                )}
              </div>
              <Link href="/login">
                <Button className="w-full rounded-full bg-primary hover:opacity-90 text-white font-semibold">
                  Return to Login
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
                  htmlFor="email"
                  className="block text-sm font-semibold mb-2 text-foreground"
                >
                  Email Address
                </label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="rounded-lg"
                />
              </div>

              <Button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-primary hover:opacity-90 text-white font-semibold rounded-full py-2"
              >
                {status === "loading" ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline transition-colors"
            >
              Log in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
