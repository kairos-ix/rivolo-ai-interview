"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Modal } from "@/components/ui/modal";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const savedData = sessionStorage.getItem("loginFormData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setTimeout(() => {
          setFormData(parsed);
        }, 0);
      } catch (err) {}
    }
  }, []);

  const { login, isLoading, isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard");
    }
  }, [isLoggedIn, router]);

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    sessionStorage.setItem("loginFormData", JSON.stringify(newData));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(formData.email, formData.password);
      sessionStorage.removeItem("loginFormData");
    } catch (error: any) {
      setError(error?.response?.data?.message || "Invalid email or password. Please try again.");
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
              Welcome Back
            </h1>
            <p className="text-center text-muted-foreground">
              Sign in to continue your interview practice
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="rounded-lg"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-foreground"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:opacity-90 text-white font-semibold rounded-full py-2 mt-6"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?{" "}
            </span>
            <Link
              href="/register"
              className="text-primary font-semibold hover:underline"
            >
              Create one
            </Link>
          </div>
        </Card>

        <Modal
          isOpen={showForgotModal}
          onClose={() => setShowForgotModal(false)}
          title="Password Reset Unavailable"
          description="The automated password reset feature is currently under development. If you need immediate assistance regaining access to your account, please contact our support team."
        >
          <div className="flex justify-end">
            <Button onClick={() => setShowForgotModal(false)} className="rounded-full">
              OK
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default LoginPage;
