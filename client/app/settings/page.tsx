"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Check, X, Shield, Trash2, Eye, EyeOff, Monitor, Smartphone, AlertTriangle, Clock, History, LogOut } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import axiosInstance from "@/lib/axios";

const passwordChecks = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "Uppercase & lowercase letters", test: (pw: string) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { label: "At least one number", test: (pw: string) => /\d/.test(pw) },
  { label: "At least one special character", test: (pw: string) => /[@$!%*?&]/.test(pw) },
];

export default function SettingsPage() {
  const { user, isLoggedIn, isLoading, changePassword, deleteAccount, logout, sendActionOTP, updateName } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [nameLoading, setNameLoading] = useState(false);

  // ── Change Password State ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState("");
  const [isPasswordOtpSent, setIsPasswordOtpSent] = useState(false);

  // ── Delete Account State ──
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePw, setShowDeletePw] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [isDeleteOtpSent, setIsDeleteOtpSent] = useState(false);

  // ── Enterprise Security State ──
  const [sessions, setSessions] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [securityLoading, setSecurityLoading] = useState(false);

  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<{ id: string; isAll: boolean } | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      const fetchSecurityData = async () => {
        setSecurityLoading(true);
        try {
          const [sessRes, histRes, alertsRes] = await Promise.all([
            axiosInstance.get("/api/auth/sessions"),
            axiosInstance.get("/api/auth/login-history"),
            axiosInstance.get("/api/auth/security-alerts"),
          ]);
          setSessions(sessRes.data.sessions);
          setLoginHistory(histRes.data.history);
          setSecurityAlerts(alertsRes.data.alerts);
        } catch (err) {
          console.error("Failed to load security data", err);
        } finally {
          setSecurityLoading(false);
        }
      };
      fetchSecurityData();
    }
  }, [isLoggedIn, isLoading]);

  const handleRevokeSession = async () => {
    if (!sessionToRevoke) return;
    setRevokeLoading(true);
    try {
      if (sessionToRevoke.isAll) {
        await axiosInstance.delete("/api/auth/sessions");
        setSessions(sessions.filter((s) => s.isCurrent));
      } else {
        await axiosInstance.delete(`/api/auth/sessions/${sessionToRevoke.id}`);
        setSessions(sessions.filter((s) => s.id !== sessionToRevoke.id));
      }
      setRevokeModalOpen(false);
      setSessionToRevoke(null);
    } catch (err) {
      console.error(err);
    } finally {
      setRevokeLoading(false);
    }
  };

  const promptRevoke = (id: string, isAll: boolean = false) => {
    setSessionToRevoke({ id, isAll });
    setRevokeModalOpen(true);
  };

  const handleUpdateName = async () => {
    if (!newName || newName.trim() === user?.name) {
      setIsEditingName(false);
      return;
    }
    setNameLoading(true);
    try {
      await updateName(newName);
      setIsEditingName(false);
    } catch (err) {
      console.error(err);
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!passwordChecks.every((c) => c.test(newPassword))) {
      setPwError("Please meet all password requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setPwError("New password must be different from your current password.");
      return;
    }

    setPwLoading(true);
    try {
      if (!isPasswordOtpSent) {
        await sendActionOTP();
        setIsPasswordOtpSent(true);
        setPwSuccess("Authorization code sent to your email.");
      } else {
        if (!passwordOtp) {
          setPwError("Please enter the authorization code.");
          setPwLoading(false);
          return;
        }
        await changePassword(currentPassword, newPassword, passwordOtp);
        setPwSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordOtp("");
        setIsPasswordOtpSent(false);
      }
    } catch (err: any) {
      setPwError(err?.response?.data?.message || "Failed to process request.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      if (!isDeleteOtpSent) {
        await sendActionOTP();
        setIsDeleteOtpSent(true);
      } else {
        if (!deleteOtp) {
          setDeleteError("Please enter the authorization code.");
          setDeleteLoading(false);
          return;
        }
        await deleteAccount(deletePassword, deleteOtp);
        // deleteAccount in context already clears auth and redirects
      }
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || "Failed to process request.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isLoading || !isLoggedIn) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background py-8 md:py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account security and preferences
          </p>
        </div>

        {/* Profile Info */}
        <Card className="p-6 border border-border/50">
          <h2 className="text-lg font-semibold text-foreground mb-4">Profile</h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-sm text-muted-foreground w-24">Name</span>
              {isEditingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    className="h-8"
                    placeholder="Your name"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleUpdateName} disabled={nameLoading} className="h-8 rounded-md bg-primary text-white">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditingName(false); setNewName(user?.name || ""); }} className="h-8 rounded-md">Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-1">
                  <span className="text-sm font-medium text-foreground">{user?.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditingName(true); setNewName(user?.name || ""); }} className="h-8 text-xs px-2 text-primary">Edit</Button>
                </div>
              )}
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-sm text-muted-foreground w-24">Email</span>
              <span className="text-sm font-medium text-foreground flex-1">{user?.email}</span>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-sm text-muted-foreground w-24">Role</span>
              <div className="flex-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  user?.role === "admin"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : user?.role === "mentor"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  <Shield className="w-3 h-3" />
                  {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student"}
                </span>
              </div>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <span className="text-sm text-muted-foreground w-24 pt-1">Permissions</span>
              <div className="flex-1 flex flex-wrap gap-2">
                {user?.permissions?.length ? (
                  user.permissions.map((p: string) => (
                    <span key={p} className="px-2 py-1 bg-muted/50 border border-border/50 text-foreground text-[10px] font-semibold rounded-md uppercase tracking-wider">
                      {p.replace(/_/g, ' ')}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground pt-1">Standard Access</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-6 border border-border/50">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
          </div>

          {pwSuccess && (
            <div className="mb-4 p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-sm border border-green-500/20">
              {pwSuccess}
            </div>
          )}
          {pwError && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
              {pwError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Current Password
                </label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-3 space-y-1.5">
                  {passwordChecks.map((check, idx) => {
                    const pass = check.test(newPassword);
                    return (
                      <div key={idx} className={`flex items-center text-xs ${pass ? "text-green-500" : "text-muted-foreground"}`}>
                        {pass ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <X className="w-3.5 h-3.5 mr-1.5 opacity-50" />}
                        {check.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="rounded-lg"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive mt-1.5">Passwords do not match</p>
              )}
            </div>

            <AnimatePresence>
              {isPasswordOtpSent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-sm font-medium text-foreground mb-1.5 mt-2">
                    Authorization Code (OTP)
                  </label>
                  <Input
                    type="text"
                    value={passwordOtp}
                    onChange={(e) => setPasswordOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    className="rounded-lg tracking-widest text-center text-lg"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    We've sent a code to your email. It expires in 5 minutes.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={pwLoading}
              className="w-full rounded-full bg-primary hover:opacity-90 text-white font-semibold mt-2"
            >
              {pwLoading ? "Processing..." : isPasswordOtpSent ? "Confirm & Update Password" : "Update Password"}
            </Button>
          </form>
        </Card>

        {/* Security Alerts */}
        {securityAlerts.length > 0 && (
          <Card className="p-6 border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-500">Security Alerts</h2>
            </div>
            <div className="space-y-3">
              {securityAlerts.map((alert, i) => (
                <div key={i} className="bg-background border border-amber-500/20 rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-foreground">
                      {alert.status === "locked" ? "Account Locked" : "Suspicious Login Attempt"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs space-y-0.5">
                    <p>Device: {alert.deviceInfo.browser} on {alert.deviceInfo.os} ({alert.deviceInfo.device})</p>
                    <p>IP Address: {alert.ipAddress}</p>
                    {alert.reason && <p className="text-amber-600 mt-1">Reason: {alert.reason.replace(/_/g, " ")}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Active Sessions */}
        <Card className="p-6 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Active Sessions</h2>
            </div>
            {sessions.length > 1 && (
              <Button size="sm" variant="outline" onClick={() => promptRevoke("all", true)} className="text-xs h-8">
                Log Out All Other Devices
              </Button>
            )}
          </div>
          {securityLoading ? (
            <div className="flex justify-center p-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No active sessions found.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-full border">
                      {session.deviceInfo.device === "Mobile" ? <Smartphone className="w-4 h-4 text-muted-foreground" /> : <Monitor className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {session.deviceInfo.browser}{session.deviceInfo.browserVersion ? ` ${session.deviceInfo.browserVersion.split('.')[0]}` : ''} on {session.deviceInfo.os}{session.deviceInfo.osVersion ? ` ${session.deviceInfo.osVersion}` : ''}
                        {session.isCurrent && <span className="text-[10px] uppercase font-bold bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-sm">Current</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {session.deviceInfo.device} · IP: {session.ipAddress} · Last active: {new Date(session.lastActiveAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button size="sm" variant="ghost" onClick={() => promptRevoke(session.id, false)} className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2 h-8">
                      <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between mt-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                <div>
                  <p className="text-sm font-semibold text-foreground">Log Out All Other Devices</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Logout of all devices except this one.</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => promptRevoke("all", true)} 
                  className="text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 h-9"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout All
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Login History */}
        <Card className="p-6 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Login History</h2>
          </div>
          {securityLoading ? (
            <div className="flex justify-center p-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : loginHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No login history available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 rounded-l-lg">Date & Time</th>
                    <th className="px-4 py-2">Device</th>
                    <th className="px-4 py-2">IP Address</th>
                    <th className="px-4 py-2 rounded-r-lg">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loginHistory.map((log, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {log.deviceInfo.browser}{log.deviceInfo.browserVersion ? ` ${log.deviceInfo.browserVersion.split('.')[0]}` : ''} ({log.deviceInfo.os}{log.deviceInfo.osVersion ? ` ${log.deviceInfo.osVersion}` : ''})
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {log.ipAddress}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          log.status === "success" ? "bg-green-500/10 text-green-600" :
                          log.status === "failed" ? "bg-red-500/10 text-red-600" :
                          "bg-amber-500/10 text-amber-600"
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data including interview history.
            This action cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-full font-semibold"
          >
            Delete My Account
          </Button>
        </Card>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Account"
        description="This will permanently delete your account and all interview data. Enter your password to confirm."
        isDanger={true}
        onConfirm={handleDeleteAccount}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletePassword("");
          setDeleteError("");
          setDeleteOtp("");
          setIsDeleteOtpSent(false);
        }}
        isLoading={deleteLoading}
        confirmText={isDeleteOtpSent ? "Confirm Deletion" : "Send Verification Code"}
      >
        {deleteError && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
            {deleteError}
          </div>
        )}
        <div className="relative mb-4">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Current Password
          </label>
          <Input
            type={showDeletePw ? "text" : "password"}
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Enter your password"
            className="rounded-lg pr-10"
            disabled={isDeleteOtpSent}
          />
          <button
            type="button"
            onClick={() => setShowDeletePw(!showDeletePw)}
            className="absolute right-3 top-[38px] -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={isDeleteOtpSent}
          >
            {showDeletePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <AnimatePresence>
          {isDeleteOtpSent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Authorization Code (OTP)
              </label>
              <Input
                type="text"
                value={deleteOtp}
                onChange={(e) => setDeleteOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                className="rounded-lg tracking-widest text-center text-lg"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                We've sent a code to your email. It expires in 5 minutes.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </ConfirmModal>

      <ConfirmModal
        isOpen={revokeModalOpen}
        title={sessionToRevoke?.isAll ? "Logout All Other Sessions" : "Logout Session"}
        description={sessionToRevoke?.isAll 
          ? "Are you sure you want to sign out of all other devices? You will remain signed in here." 
          : "Are you sure you want to sign out of this device?"}
        confirmText="Logout"
        isDanger={true}
        isLoading={revokeLoading}
        onConfirm={handleRevokeSession}
        onCancel={() => { setRevokeModalOpen(false); setSessionToRevoke(null); }}
      />
    </div>
  );
}
