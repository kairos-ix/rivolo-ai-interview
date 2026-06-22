"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  clearAuth,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
  StoredUser,
} from "@/lib/auth";

// ── Types ─────────────────────────────────────────────────
interface AuthContextValue {
  user: StoredUser | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, otp: string) => Promise<void>;
  deleteAccount: (password: string, otp: string) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  sendActionOTP: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
}

// ── Context ───────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true on first load

  // Hydrate from localStorage on mount
  useEffect(() => {
    const hydrate = async () => {
      const storedToken = getToken();
      const storedUser = getStoredUser();

      if (storedToken && storedUser) {
        setTokenState(storedToken);
        setUser(storedUser);
      }

      setIsLoading(false);
    };
    hydrate();
  }, []);

  // ── Login ───────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const { data } = await axiosInstance.post("/api/auth/login", {
          email,
          password,
        });

        setToken(data.token);
        setStoredUser(data.user);
        setTokenState(data.token);
        setUser(data.user);

        router.push("/dashboard");
      } catch (err: any) {
        if (err.response?.data?.requiresVerification) {
          sessionStorage.setItem("verificationEmail", err.response.data.email);
          router.push("/verify-email");
          throw new Error("Verification required"); // Prevent standard error handling if any
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  // ── Register ────────────────────────────────────────────
  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      try {
        const { data } = await axiosInstance.post("/api/auth/register", {
          name,
          email,
          password,
        });

        if (data.requiresVerification) {
          sessionStorage.setItem("verificationEmail", data.email);
          router.push("/verify-email");
          return;
        }

        // Fallback if verification isn't required (e.g. they somehow hit the old logic)
        setToken(data.token);
        setStoredUser(data.user);
        setTokenState(data.token);
        setUser(data.user);
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  // ── Logout ──────────────────────────────────────────────
  const logout = useCallback(() => {
    clearAuth();
    setTokenState(null);
    setUser(null);
    router.push("/");
  }, [router]);

  // ── Refresh user from API ───────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/api/auth/me");
      setStoredUser(data.user);
      setUser(data.user);
    } catch {
      // token invalid — log out
      logout();
    }
  }, [logout]);

  const updateName = useCallback(async (name: string) => {
    const { data } = await axiosInstance.put("/api/auth/update-name", { name });
    setStoredUser(data.user);
    setUser(data.user);
  }, []);

  // ── Change Password ────────────────────────────────────
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string, otp: string) => {
      const { data } = await axiosInstance.put("/api/auth/change-password", {
        currentPassword,
        newPassword,
        otp,
      });
      return data;
    },
    [],
  );

  // ── Delete Account ─────────────────────────────────────
  const deleteAccount = useCallback(
    async (password: string, otp: string) => {
      await axiosInstance.delete("/api/auth/delete-account", {
        data: { password, otp },
      });
      clearAuth();
      setTokenState(null);
      setUser(null);
      router.push("/");
    },
    [router],
  );

  // ── Verification ─────────────────────────────────────────
  const verifyEmail = useCallback(
    async (email: string, otp: string) => {
      const { data } = await axiosInstance.post("/api/auth/verify-email", { email, otp });
      setToken(data.token);
      setStoredUser(data.user);
      setTokenState(data.token);
      setUser(data.user);
      sessionStorage.removeItem("verificationEmail");
      router.push("/dashboard");
    },
    [router],
  );

  const resendOTP = useCallback(
    async (email: string) => {
      await axiosInstance.post("/api/auth/resend-otp", { email });
    },
    [],
  );

  const sendActionOTP = useCallback(
    async () => {
      await axiosInstance.post("/api/auth/send-action-otp");
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isLoggedIn: !!token && !!user,
      login,
      register,
      logout,
      refreshUser,
      changePassword,
      deleteAccount,
      verifyEmail,
      resendOTP,
      sendActionOTP,
      updateName,
    }),
    [user, token, isLoading, login, register, logout, refreshUser, changePassword, deleteAccount, verifyEmail, resendOTP, sendActionOTP, updateName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Raw context export (used by useAuth hook) ─────────────
export { AuthContext };
