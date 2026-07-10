"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import React, { useState, useRef } from "react";
import api from "@/lib/axios";
import { Mail, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "success">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await api.post("/api/auth/forgot-password", { email });
      setStatus("idle");
      setStep("otp");
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setStatus("error");
      setMessage("Please enter the complete 6-digit code.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      await api.post("/api/auth/reset-password", { 
        email,
        otp: otpValue,
        password 
      });
      setStatus("idle");
      setStep("success");
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.response?.data?.message || "Invalid OTP or password doesn't meet requirements.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-6">
          <img src="/favicon.svg" alt="Logo" className="w-12 h-12 rounded-xl shadow-md" />
        </div>

        <Card className="p-8 border border-border/50 shadow-2xl bg-card/80 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: EMAIL */}
            {step === "email" && (
              <motion.div 
                key="step-email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">Reset Password</h1>
                  <p className="text-muted-foreground text-sm">
                    Enter your email and we'll send you a 6-digit verification code.
                  </p>
                </div>

                <form onSubmit={handleRequestOTP} className="space-y-6">
                  {status === "error" && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                      {message}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="pl-9 rounded-lg"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={status === "loading" || !email}
                    className="w-full bg-primary hover:opacity-90 text-white font-semibold rounded-lg"
                  >
                    {status === "loading" ? "Sending Code..." : "Send Verification Code"}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                  <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 inline-flex">
                    <ArrowLeft className="w-4 h-4" /> Back to login
                  </Link>
                </div>
              </motion.div>
            )}

            {/* STEP 2: OTP & NEW PASSWORD */}
            {step === "otp" && (
              <motion.div 
                key="step-otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
                  <p className="text-muted-foreground text-sm">
                    We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  {status === "error" && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg text-center font-medium">
                      {message}
                    </div>
                  )}

                  {/* OTP Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground text-center mb-3">
                      Verification Code
                    </label>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                        New Password
                      </label>
                      <Input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground">
                        Confirm New Password
                      </label>
                      <Input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={status === "loading" || otp.join("").length !== 6 || !password}
                    className="w-full bg-primary hover:opacity-90 text-white font-semibold rounded-lg"
                  >
                    {status === "loading" ? "Resetting Password..." : "Reset Password"}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                  <button 
                    onClick={() => setStep("email")}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 inline-flex"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change email
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === "success" && (
              <motion.div 
                key="step-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-6"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Password Reset!</h1>
                <p className="text-muted-foreground text-sm mb-8">
                  Your password has been successfully updated. You can now use your new password to sign in.
                </p>
                <Link href="/login">
                  <Button className="w-full bg-primary hover:opacity-90 text-white font-semibold rounded-lg">
                    Go to Login
                  </Button>
                </Link>
              </motion.div>
            )}
            
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
