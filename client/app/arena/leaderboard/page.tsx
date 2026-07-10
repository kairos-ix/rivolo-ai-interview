"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trophy, Flame, Star, TrendingUp, Award, Users, Target,
  Brain, Heart, Shield, Loader2, ArrowLeft, BarChart3, Crown
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import { computeRankLabel } from "./rankUtils";

interface GlobalEntry {
  globalRank: number;
  userId: string;
  userName: string;
  totalPoints: number;
  totalChallengesCompleted: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number;
  badgeCount: number;
  rankLabel: string;
  rankEmoji: string;
  isMe: boolean;
}

interface ChallengeEntry {
  rank: number;
  userId: string;
  userName: string;
  totalScore: number;
  pointsEarned: number;
  timeTakenSeconds: number;
  completedAt: string;
  isMe: boolean;
}

interface ArenaProfile {
  totalChallengesCompleted: number;
  totalPoints: number;
  bestScore: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  globalRank: number | null;
  rankHistory: { globalRank: number; totalPoints: number; date: string }[];
  badges: { id: string; name: string; emoji: string; description: string; earnedAt: string }[];
  categoryStats: Record<string, { completed: number; totalScore: number }>;
  rankLabel: string;
  rankEmoji: string;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function LeaderboardContent() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeId = searchParams.get("challenge");

  const [tab, setTab] = useState<"global" | "challenge">(challengeId ? "challenge" : "global");
  const [globalLeaderboard, setGlobalLeaderboard] = useState<GlobalEntry[]>([]);
  const [challengeLeaderboard, setChallengeLeaderboard] = useState<ChallengeEntry[]>([]);
  const [challengeInfo, setChallengeInfo] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<ArenaProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) router.push("/login");
  }, [isLoggedIn, router]);

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      setLoading(true);
      const [globalRes, profileRes] = await Promise.all([
        axiosInstance.get("/api/arena/leaderboard/global"),
        axiosInstance.get("/api/arena/my-profile"),
      ]);
      setGlobalLeaderboard(globalRes.data.leaderboard || []);
      setMyProfile(profileRes.data.profile);

      if (challengeId) {
        const cRes = await axiosInstance.get(`/api/arena/leaderboard/${challengeId}`);
        setChallengeLeaderboard(cRes.data.leaderboard || []);
        setChallengeInfo(cRes.data.challenge);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, challengeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!isLoggedIn) return null;

  const rankBgColor = (rank: number) => {
    if (rank === 1) return "bg-amber-500/10 border-amber-500/30";
    if (rank === 2) return "bg-slate-400/10 border-slate-400/30";
    if (rank === 3) return "bg-orange-600/10 border-orange-600/30";
    return "bg-card border-border/50";
  };

  const rankLabel = (rank: number) => {
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Back Button */}
        <div className="mb-6">
          <Link href="/arena">
            <Button variant="outline" size="sm" className="rounded-full shadow-sm hover:shadow-md transition-all border-border/60 hover:bg-muted/50">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Arena
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500" /> Leaderboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">See how you stack up against other candidates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Leaderboard */}
          <div className="lg:col-span-2 space-y-4">

            {/* Tabs */}
            <div className="flex gap-1 bg-muted/50 rounded-xl p-1 border border-border/50 w-fit">
              <button
                onClick={() => setTab("global")}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === "global" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🌍 Global
              </button>
              {challengeId && (
                <button
                  onClick={() => setTab("challenge")}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === "challenge" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ⚡ This Challenge
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading leaderboard...</span>
              </div>
            ) : tab === "global" ? (
              <div className="space-y-2">
                {globalLeaderboard.length === 0 ? (
                  <Card className="p-8 text-center border-border/50">
                    <p className="text-muted-foreground">No entries yet. Be the first to complete a challenge!</p>
                  </Card>
                ) : globalLeaderboard.map((entry, idx) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <div className={`rounded-xl bg-card p-4 border flex items-center gap-4 ${rankBgColor(entry.globalRank)} ${entry.isMe ? "ring-2 ring-primary/40" : ""}`}>
                      <div className="w-10 flex-shrink-0 flex items-center justify-center">
                        {rankLabel(entry.globalRank)}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-black">
                          {entry.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {entry.userName} {entry.isMe && <span className="text-primary text-xs font-bold">(You)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.rankEmoji} {entry.rankLabel} · {entry.totalChallengesCompleted} challenges · {entry.currentStreak}🔥 streak
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-black text-foreground">{entry.totalPoints}</p>
                        <p className="text-xs text-muted-foreground">pts</p>
                      </div>
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <p className="text-sm font-bold text-foreground">{entry.averageScore}</p>
                        <p className="text-xs text-muted-foreground">avg score</p>
                      </div>
                      {entry.badgeCount > 0 && (
                        <div className="flex-shrink-0 hidden sm:flex items-center gap-1 bg-amber-500/10 rounded-full px-2 py-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          <span className="text-xs font-bold text-amber-600">{entry.badgeCount}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              // Challenge-specific leaderboard
              <div className="space-y-2">
                {challengeInfo && (
                  <Card className="p-4 border-border/50 bg-muted/20 mb-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                      {challengeInfo.category} · {challengeInfo.type}
                    </p>
                    <p className="font-bold text-foreground">{challengeInfo.title}</p>
                  </Card>
                )}
                {challengeLeaderboard.length === 0 ? (
                  <Card className="p-8 text-center border-border/50">
                    <p className="text-muted-foreground">No entries yet for this challenge. Be the first!</p>
                    <Link href={`/arena/challenge/${challengeId}`} className="mt-4 inline-block">
                      <Button className="rounded-full">Take Challenge</Button>
                    </Link>
                  </Card>
                ) : challengeLeaderboard.map((entry, idx) => (
                  <motion.div
                    key={entry.userId + idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <div className={`rounded-xl bg-card p-4 border flex items-center gap-4 ${rankBgColor(entry.rank)} ${entry.isMe ? "ring-2 ring-primary/40" : ""}`}>
                      <div className="w-10 flex-shrink-0 flex items-center justify-center">
                        {rankLabel(entry.rank)}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-black">{entry.userName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">
                          {entry.userName} {entry.isMe && <span className="text-primary text-xs font-bold">(You)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.pointsEarned} pts earned · {formatTime(entry.timeTakenSeconds)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-black text-foreground">{entry.totalScore}</p>
                        <p className="text-xs text-muted-foreground">/100</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* My Stats Sidebar */}
          <div className="space-y-4">
            {myProfile && (
              <>
                {/* Rank Card */}
                <Card className="p-5 border border-border/50 space-y-4">
                  <h2 className="font-bold text-foreground flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" /> My Standing
                  </h2>
                  <div className="text-center py-2">
                    <p className="text-5xl mb-1">{myProfile.rankEmoji}</p>
                    <p className="text-xl font-black text-foreground">{myProfile.rankLabel}</p>
                    <p className="text-sm text-muted-foreground">{myProfile.totalPoints} total points</p>
                    {myProfile.globalRank && (
                      <p className="text-xs text-muted-foreground mt-1">Global Rank #{myProfile.globalRank}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Challenges", value: myProfile.totalChallengesCompleted, icon: <Target className="w-4 h-4" /> },
                      { label: "Best Score", value: `${myProfile.bestScore}/100`, icon: <Star className="w-4 h-4" /> },
                      { label: "Avg Score", value: `${myProfile.averageScore}/100`, icon: <BarChart3 className="w-4 h-4" /> },
                      { label: "Streak", value: `${myProfile.currentStreak}🔥`, icon: <Flame className="w-4 h-4" /> },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-muted/50 rounded-xl p-3 text-center border border-border/50">
                        <p className="text-lg font-black text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Badges */}
                <Card className="p-5 border border-border/50 space-y-3">
                  <h2 className="font-bold text-foreground flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" /> My Badges
                    <span className="ml-auto text-xs text-muted-foreground">{myProfile.badges.length} earned</span>
                  </h2>
                  {myProfile.badges.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      Complete challenges to earn badges! 🏆
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {myProfile.badges.map((badge) => (
                        <div
                          key={badge.id}
                          title={badge.description}
                          className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1.5 text-xs font-semibold text-amber-700 cursor-help"
                        >
                          <span>{badge.emoji}</span> {badge.name}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Category breakdown */}
                {myProfile.categoryStats && (
                  <Card className="p-5 border border-border/50 space-y-3">
                    <h2 className="font-bold text-foreground flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" /> Category Stats
                    </h2>
                    <div className="space-y-2.5">
                      {Object.entries(myProfile.categoryStats).map(([cat, stats]) => {
                        const avg = stats.completed > 0 ? Math.round(stats.totalScore / stats.completed) : 0;
                        return (
                          <div key={cat}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-medium text-foreground">{cat}</span>
                              <span className="text-muted-foreground">{stats.completed} done · {avg}/100 avg</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${avg}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  );
}
