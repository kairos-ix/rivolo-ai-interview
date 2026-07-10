"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { StoredUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { useRef } from "react";
import {
  Users, UserCheck, Shield, ChevronLeft, ChevronRight, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminUser extends StoredUser {
  _id?: string;
  isVerified: boolean;
  createdAt: string;
  isRestricted?: boolean;
}

interface MetricsState {
  total: number;
  students: number;
  mentors: number;
  admins: number;
}

function CustomRoleSelect({ value, onChange, disabled, disabledOptions = [] }: { value: string; onChange: (v: string) => void; disabled?: boolean; disabledOptions?: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = ["Student", "Mentor", "Admin"];
  
  return (
    <div className="relative inline-block w-32" ref={ref}>
      <button 
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full bg-background border border-border text-foreground text-sm rounded-lg hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary px-3 py-1.5 transition-all shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed hover:border-border' : ''}`}
      >
        <span className="font-medium">{value.charAt(0).toUpperCase() + value.slice(1)}</span>
        <ChevronDown className={`w-4 h-4 ml-2 opacity-50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => {
            const isOptionDisabled = disabledOptions.includes(option.toLowerCase());
            return (
              <button
                key={option}
                type="button"
                disabled={isOptionDisabled}
                onClick={() => {
                  if (!isOptionDisabled) {
                    onChange(option.toLowerCase());
                    setOpen(false);
                  }
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  value.toLowerCase() === option.toLowerCase()
                    ? "bg-primary text-primary-foreground font-medium"
                    : isOptionDisabled
                    ? "text-muted-foreground/50 cursor-not-allowed"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { user: currentUser, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<MetricsState>({ total: 0, students: 0, mentors: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Route protection
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (!authLoading && isLoggedIn && currentUser?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [authLoading, isLoggedIn, currentUser, router]);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [usersRes, metricsRes] = await Promise.all([
        axiosInstance.get(`/api/admin/users?page=${page}&limit=10`),
        axiosInstance.get("/api/admin/metrics"),
      ]);

      setUsers(usersRes.data.users);
      setTotalPages(usersRes.data.pagination.pages);
      setMetrics(metricsRes.data.users);
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to load admin data" });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isLoggedIn && currentUser?.role === "admin") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData(true);
    }
  }, [page, isLoggedIn, currentUser?.role, fetchData]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await axiosInstance.put(`/api/admin/users/${userId}/role`, { role: newRole });
      setMessage({ type: "success", text: "Role updated successfully" });
      await fetchData(false); // Refresh data without UI flicker
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to update role" });
    }
  };

  const handleToggleRestriction = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await axiosInstance.put(`/api/admin/users/${userId}/restrict`, { restricted: newStatus });
      setMessage({ 
        type: "success", 
        text: newStatus ? "User has been restricted" : "User restriction lifted" 
      });
      await fetchData(false); // Refresh data without UI flicker
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to update restriction status" });
    }
  };

  const statCards = [
    { label: "Total Users", value: metrics.total, icon: <Users className="w-4 h-4" />, color: "text-primary" },
    { label: "Students", value: metrics.students, icon: <UserCheck className="w-4 h-4" />, color: "text-blue-500" },
    { label: "Mentors", value: metrics.mentors, icon: <Shield className="w-4 h-4" />, color: "text-purple-500" },
    { label: "Admins", value: metrics.admins, icon: <Shield className="w-4 h-4" />, color: "text-red-500" },
  ];

  return (
    <div className="space-y-8 relative">
      {/* Feedback Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl border shadow-2xl text-sm font-semibold flex justify-between items-center min-w-[300px] ${
              message.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-green-200 text-green-700"
            }`}
          >
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="font-bold opacity-60 hover:opacity-100 ml-4 p-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="p-5 border-border/60">
            <p className={`text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2 ${card.color}`}>
              {card.icon}
              {card.label}
            </p>
            <h3 className="text-3xl font-black">{card.value}</h3>
          </Card>
        ))}
      </div>

      {/* User Management Table */}
      <Card className="border-border/60 overflow-visible">
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-lg font-bold">User Management</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="border-b border-border/50">
              <tr>
                {["Name", "Email", "Joined", "Status", "Role", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">{user.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-start">
                        {user.isVerified ? (
                          <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium border border-yellow-200">
                            Unverified
                          </span>
                        )}
                        {user.isRestricted && (
                          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium border border-red-200">
                            Restricted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <CustomRoleSelect
                        value={user.role || "student"}
                        onChange={(newRole) => handleRoleChange(user._id, newRole)}
                        disabled={currentUser?.id === user._id || currentUser?.id === user.id || user.role === 'admin'}
                        disabledOptions={["admin"]}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleRestriction(user._id, !!user.isRestricted)}
                        disabled={currentUser?.id === user._id || currentUser?.id === user.id || user.role === 'admin'}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                          user.isRestricted
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                            : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {user.isRestricted ? "Unrestrict" : "Restrict"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page <span className="font-semibold text-foreground">{page}</span> of{" "}
              <span className="font-semibold text-foreground">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
