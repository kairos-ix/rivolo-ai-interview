"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Target, BarChart, Sparkles, Search, Puzzle,
  Settings, TrendingUp, Building2, Trophy, ChevronDown,
  LogOut, User, Grid3x3, Shield
} from "lucide-react";

// ── Primary nav (always visible on desktop) ──────────────────
const primaryLinks = [
  { href: "/dashboard", label: "Dashboard", icon: <Zap className="w-4 h-4" />, roles: ["student", "mentor", "admin"] },
  { href: "/practice", label: "Practice", icon: <Target className="w-4 h-4" />, roles: ["student"] },
  { href: "/history", label: "My Sessions", icon: <BarChart className="w-4 h-4" />, roles: ["student"] },
  { href: "/mentor", label: "Mentor Dashboard", icon: <Building2 className="w-4 h-4" />, roles: ["mentor"] },
  { href: "/admin", label: "Admin Dashboard", icon: <Shield className="w-4 h-4" />, roles: ["admin"] },
];

// ── Tools dropdown ────────────────────────────────────────────
const toolLinks = [
  { href: "/placement", label: "Placement Engine", icon: <TrendingUp className="w-4 h-4" />, desc: "Placement readiness score & roadmap", roles: ["student", "mentor", "admin"] },
  { href: "/recruiter", label: "Recruiter Sim", icon: <Building2 className="w-4 h-4" />, desc: "Company-specific interview simulation", roles: ["student", "mentor", "admin"] },
  { href: "/arena", label: "Challenge Arena", icon: <Trophy className="w-4 h-4" />, desc: "Daily challenges & leaderboard", roles: ["student", "mentor", "admin"] },
];

// ── Public nav ────────────────────────────────────────────────
const publicLinks = [
  { href: "/#features", label: "Features", icon: <Sparkles className="w-4 h-4" /> },
  { href: "/#how-it-works", label: "How It Works", icon: <Search className="w-4 h-4" /> },
  { href: "/#domains", label: "Domains", icon: <Puzzle className="w-4 h-4" /> },
];

export function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // mounted guards against hydration mismatches: auth state is unknown during SSR
  // so we always render the public nav on first paint, then swap after mount.
  const [mounted, setMounted] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
    setToolsOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileOpen(false);
    if (href.startsWith("/#") && pathname === "/") {
      e.preventDefault();
      const elem = document.getElementById(href.replace("/#", ""));
      if (elem) {
        window.scrollTo({ top: elem.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
      }
    }
  };

  const isActive = (path: string) => pathname === path;
  // Use auth state only after client mount to avoid hydration mismatch
  const effectiveLoggedIn = mounted && isLoggedIn;
  const isToolActive = toolLinks.some((t) => isActive(t.href));

  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <>
      <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border/60 shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0" onClick={() => setMobileOpen(false)}>
              <Image src="/favicon.svg" alt="Logo" width={34} height={34} className="rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200" />
              <div className="flex flex-col leading-none">
                <span className="text-base font-black text-primary tracking-tight">Rivolo</span>
                <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">AI Powered</span>
              </div>
            </Link>

            {/* ── Desktop Center Nav ── */}
            <div className="hidden md:flex items-center gap-0.5">
              {effectiveLoggedIn ? (
                <>
                  {/* Primary links */}
                  {primaryLinks
                    .filter((link) => link.roles.includes(user?.role || "student"))
                    .map((link) => (
                    <Link key={link.href} href={link.href}>
                      <button className={`relative px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                        isActive(link.href)
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}>
                        <span className="text-xs">{link.icon}</span>
                        {link.label}
                        {isActive(link.href) && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>
                    </Link>
                  ))}

                  {/* Tools dropdown */}
                  <div ref={toolsRef} className="relative">
                    <button
                      onClick={() => setToolsOpen((v) => !v)}
                      className={`relative px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                        isToolActive || toolsOpen
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Grid3x3 className="w-3.5 h-3.5" />
                      Tools
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${toolsOpen ? "rotate-180" : ""}`} />
                      {isToolActive && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </button>

                    <AnimatePresence>
                      {toolsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.97 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 z-50"
                        >
                          <div className="p-2 shadow-xl rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl">
                            {toolLinks
                              .filter(tool => !tool.roles || tool.roles.includes(user?.role || "student"))
                              .map((tool) => (
                              <Link key={tool.href} href={tool.href} onClick={() => setToolsOpen(false)}>
                                <div className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                                  isActive(tool.href)
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-muted/60 text-foreground"
                                }`}>
                                  <span className={`mt-0.5 flex-shrink-0 ${isActive(tool.href) ? "text-primary" : "text-muted-foreground"}`}>
                                    {tool.icon}
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold leading-none mb-1">{tool.label}</p>
                                    <p className="text-xs text-muted-foreground">{tool.desc}</p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                // Public links
                publicLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)}>
                    <button className="px-3.5 py-2 text-sm font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 flex items-center gap-1.5">
                      <span className="text-xs">{link.icon}</span>
                      {link.label}
                    </button>
                  </Link>
                ))
              )}
            </div>

            {/* ── Desktop Right Controls ── */}
            <div className="hidden md:flex items-center gap-2">
              {effectiveLoggedIn ? (
                // User avatar dropdown
                <div ref={userRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 bg-muted/50 border border-border/60 rounded-full pl-1.5 pr-2.5 py-1 hover:bg-muted/80 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[10px] font-black">{initial}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{firstName}</span>
                    <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full right-0 mt-2 w-52 z-50"
                      >
                        <div className="p-2 shadow-xl rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl">
                          {/* User info */}
                          <div className="px-3 py-2 mb-1">
                            <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                          </div>
                          <div className="h-px bg-border/50 mb-1" />
                          <Link href="/settings" onClick={() => setUserMenuOpen(false)}>
                            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted/60 text-foreground transition-colors cursor-pointer">
                              <Settings className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Settings</span>
                            </div>
                          </Link>
                          <div className="h-px bg-border/50 my-1" />
                          <button
                            onClick={() => { setUserMenuOpen(false); setShowLogoutConfirm(true); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className={`rounded-full transition-colors ${
                      isActive("/login") ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}>
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="rounded-full bg-primary hover:opacity-90 text-white shadow-md font-semibold">
                      Get Started →
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile Hamburger ── */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted/50 transition-colors"
              aria-label="Toggle menu"
            >
              <div className="relative w-5 h-[14px]">
                <span className={`absolute left-0 block h-[2px] w-5 bg-foreground rounded-full transition-all duration-300 ease-in-out ${mobileOpen ? "top-[6px] rotate-45" : "top-0"}`} />
                <span className={`absolute left-0 top-[6px] block h-[2px] w-5 bg-foreground rounded-full transition-all duration-300 ease-in-out ${mobileOpen ? "opacity-0 scale-x-0" : "opacity-100"}`} />
                <span className={`absolute left-0 block h-[2px] w-5 bg-foreground rounded-full transition-all duration-300 ease-in-out ${mobileOpen ? "top-[6px] -rotate-45" : "top-[12px]"}`} />
              </div>
            </button>
          </div>
        </div>

        {/* ── Mobile Menu Panel ── */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? "max-h-[100dvh] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 px-4 py-4 space-y-1">
            {effectiveLoggedIn ? (
              <>
                {/* User info */}
                <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-muted/30 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-black">{initial}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>

                {/* All links flat in mobile */}
                {[
                  ...primaryLinks.filter(t => t.roles.includes(user?.role || "student")), 
                  ...toolLinks.filter(t => !t.roles || t.roles.includes(user?.role || "student"))
                ].map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive(link.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}>
                      {link.icon}
                      <span className="font-medium">{link.label}</span>
                      {isActive(link.href) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                  </Link>
                ))}


                <div className="h-px bg-border/50 my-2" />

                <Link href="/settings" onClick={() => setMobileOpen(false)}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">Settings</span>
                  </div>
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); setShowLogoutConfirm(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <>
                {publicLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                      {link.icon}
                      <span className="font-medium">{link.label}</span>
                    </div>
                  </Link>
                ))}
                <div className="h-px bg-border/50 my-2" />
                <div className="space-y-2 pt-1">
                  <Link href="/login" className="block" onClick={(e) => handleNavClick(e, "/login")}>
                    <Button variant="outline" className="w-full rounded-xl">Login</Button>
                  </Link>
                  <Link href="/register" className="block" onClick={(e) => handleNavClick(e, "/register")}>
                    <Button className="w-full rounded-xl bg-primary hover:opacity-90 text-white font-semibold">
                      Get Started Free →
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Logout Confirmation Modal ── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-sm"
            >
              <Card className="w-full p-6 border border-border shadow-2xl">
                <h3 className="text-lg font-bold text-foreground mb-2">Confirm Logout</h3>
                <p className="text-sm text-muted-foreground mb-6">Are you sure you want to log out of your account?</p>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setShowLogoutConfirm(false)} className="rounded-full border-border/60">Cancel</Button>
                  <Button variant="destructive" onClick={() => { setShowLogoutConfirm(false); logout(); }} className="rounded-full">Logout</Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
