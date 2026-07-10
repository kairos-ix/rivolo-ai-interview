"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trophy, Flame, Zap, Clock, Users, Target, Brain, Heart, Star,
  ChevronRight, RefreshCw, Loader2, TrendingUp, Shield, Award
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import Link from "next/link";

interface Challenge {
  _id: string;
  title: string;
  description: string;
  category: "Technical" | "HR" | "Aptitude" | "Domain";
  type: "daily" | "weekly";
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  participantCount: number;
  expiresAt: string;
  isCompleted: boolean;
  myScore: number | null;
  myRank: number | null;
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  Technical: {
    icon: <Brain className="w-5 h-5" />,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  HR: {
    icon: <Heart className="w-5 h-5" />,
    color: "text-rose-600",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  Aptitude: {
    icon: <Target className="w-5 h-5" />,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  Domain: {
    icon: <Shield className="w-5 h-5" />,
    color: "text-violet-600",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
};

const difficultyConfig: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: "Easy", color: "text-green-600", bg: "bg-green-500/10" },
  medium: { label: "Medium", color: "text-orange-600", bg: "bg-orange-500/10" },
  hard: { label: "Hard", color: "text-red-600", bg: "bg-red-500/10" },
};

function TimeRemaining({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h >= 24) {
        const d = Math.floor(h / 24);
        setRemaining(`${d}d ${h % 24}h left`);
      } else {
        setRemaining(`${h}h ${m}m left`);
      }
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [expiresAt]);

  return <span>{remaining}</span>;
}

const ArenaPage = () => {
  const { isLoggedIn, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "daily" | "weekly">("all");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [authLoading, isLoggedIn, router]);

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/arena/challenges");
      setChallenges(res.data.challenges || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchChallenges();
    }
  }, [isLoggedIn, fetchChallenges]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header skeleton */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-muted animate-pulse" />
            <div className="h-10 w-64 bg-muted rounded-xl mx-auto animate-pulse" />
            <div className="h-5 w-96 bg-muted rounded-lg mx-auto animate-pulse" />
          </div>
          {/* Challenge card skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  const filtered = challenges.filter((c) =>
    activeFilter === "all" ? true : c.type === activeFilter
  );

  const dailyChallenges = filtered.filter((c) => c.type === "daily");
  const weeklyChallenges = filtered.filter((c) => c.type === "weekly");

  const completedCount = challenges.filter((c) => c.isCompleted).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center space-y-5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2"
          >
            <Trophy className="w-10 h-10 text-amber-500" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-3">
              Peer Challenge Arena
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Compete with other candidates through AI-generated interview challenges. Earn badges,
              climb the leaderboard, and track your standing among peers.
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 text-sm font-medium border border-border/50">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-muted-foreground">{challenges.length} Active Challenges</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 text-sm font-medium border border-border/50">
              <Star className="w-4 h-4 text-green-500" />
              <span className="text-muted-foreground">{completedCount} Completed Today</span>
            </div>
            <Link href="/arena/leaderboard">
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-primary font-semibold">View Leaderboard</span>
              </div>
            </Link>
          </div>

          {/* Filter tabs */}
          <div className="inline-flex gap-1 bg-muted/50 rounded-full p-1 border border-border/50">
            {(["all", "daily", "weekly"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                  activeFilter === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f === "daily" ? "⚡ Daily" : "📅 Weekly"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground text-lg">Loading challenges...</span>
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl">🏟️</div>
            <h2 className="text-xl font-bold text-foreground">No active challenges yet</h2>
            <p className="text-muted-foreground">Challenges are generated automatically. Check back soon!</p>
            <Button onClick={fetchChallenges} variant="outline" className="rounded-full">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        ) : (
          <>
            {/* Daily Challenges */}
            {(activeFilter === "all" || activeFilter === "daily") && dailyChallenges.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h2 className="text-xl font-bold text-foreground">Daily Challenges</h2>
                  </div>
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1 border border-border/50">
                    Resets every 24h
                  </span>
                </div>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
                >
                  {dailyChallenges.map((c) => (
                    <ChallengeCard key={c._id} challenge={c} variants={itemVariants} />
                  ))}
                </motion.div>
              </div>
            )}

            {/* Weekly Challenges */}
            {(activeFilter === "all" || activeFilter === "weekly") && weeklyChallenges.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-violet-500" />
                    <h2 className="text-xl font-bold text-foreground">Weekly Challenges</h2>
                  </div>
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1 border border-border/50">
                    Resets every 7 days
                  </span>
                </div>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
                >
                  {weeklyChallenges.map((c) => (
                    <ChallengeCard key={c._id} challenge={c} variants={itemVariants} />
                  ))}
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function ChallengeCard({ challenge, variants }: { challenge: Challenge; variants: any }) {
  const cat = categoryConfig[challenge.category] || categoryConfig.Technical;
  const diff = difficultyConfig[challenge.difficulty] || difficultyConfig.medium;

  return (
    <motion.div variants={variants}>
      <Card className={`h-full flex flex-col p-5 border hover:shadow-md transition-all duration-200 bg-card ${
        challenge.isCompleted
          ? "border-green-500/30 bg-green-500/5"
          : "border-border/50 hover:border-primary/30"
      }`}>
        {/* Category + type badges */}
        <div className="flex items-start justify-between mb-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cat.bg} ${cat.color} ${cat.border}`}>
            {cat.icon}
            {challenge.category}
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
            challenge.type === "daily"
              ? "bg-orange-500/10 text-orange-600"
              : "bg-violet-500/10 text-violet-600"
          }`}>
            {challenge.type}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-foreground text-sm mb-2 leading-snug">{challenge.title}</h3>
        <div className="flex-grow flex flex-col">
          <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
            {challenge.description}
          </p>
        </div>

        {/* Meta */}
        <div className="space-y-2 mb-4 mt-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {challenge.participantCount} participants
            </span>
            <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${diff.bg} ${diff.color}`}>
              {diff.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <TimeRemaining expiresAt={challenge.expiresAt} />
          </div>
        </div>

        {/* Action */}
        {challenge.isCompleted ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600 font-semibold flex items-center gap-1">
                ✅ Completed
              </span>
              {challenge.myScore !== null && (
                <span className="font-bold text-foreground">{challenge.myScore}/100</span>
              )}
            </div>
            <Link href={`/arena/leaderboard?challenge=${challenge._id}`}>
              <Button variant="outline" size="sm" className="w-full rounded-lg text-xs">
                View Leaderboard <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        ) : (
          <Link href={`/arena/challenge/${challenge._id}`}>
            <Button className="w-full rounded-lg font-semibold text-sm" size="sm">
              Take Challenge <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </Card>
    </motion.div>
  );
}

export default ArenaPage;
