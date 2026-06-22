"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Mail, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function VerifyEmailPage() {
  const { verifyEmail, resendOTP } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("verificationEmail");
    if (!savedEmail) {
      router.push("/login");
    } else {
      setEmail(savedEmail);
    }
  }, [router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmail(email, otp);
      // verifyEmail redirects to dashboard on success
    } catch (err: any) {
      setError(err?.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    setSuccess("");
    setResendLoading(true);

    try {
      await resendOTP(email);
      setSuccess("A new verification code has been sent to your email!");
      setCooldown(60); // 60 seconds cooldown
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) return null; // Wait for useEffect

  return (
    <div className="flex-1 flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Check your email
          </h1>
          <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
            We've sent a 6-digit verification code to <span className="font-semibold text-foreground">{email}</span>.
          </p>
        </div>

        <Card className="p-6 border border-border/50 shadow-2xl bg-card/80 backdrop-blur-sm">
          {error && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-sm text-center font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Verification Code
              </label>
              <Input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full h-12 rounded-full bg-primary hover:opacity-90 text-white font-semibold transition-all group"
            >
              {isLoading ? (
                "Verifying..."
              ) : (
                <>
                  Verify Account
                  <ShieldCheck className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={resendLoading || cooldown > 0}
              onClick={handleResend}
              className="w-full rounded-full border-border/60 hover:bg-secondary/50 transition-all"
            >
              {resendLoading ? (
                "Sending..."
              ) : cooldown > 0 ? (
                `Resend code in ${cooldown}s`
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Code
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
