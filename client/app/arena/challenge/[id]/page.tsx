"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, ChevronRight, Trophy, Clock, CheckCircle2,
  AlertCircle, Star, ArrowLeft, Brain, Heart, Target, Shield
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import Link from "next/link";

interface Question {
  questionText: string;
  expectedKeyPoints: string[];
  _id: string;
}

interface Challenge {
  _id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  difficulty: string;
  questions: Question[];
  expiresAt: string;
  participantCount: number;
}

interface AnswerScore {
  questionIndex: number;
  questionText: string;
  answerText: string;
  score: number;
  aiFeedback: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  Technical: <Brain className="w-5 h-5" />,
  HR: <Heart className="w-5 h-5" />,
  Aptitude: <Target className="w-5 h-5" />,
  Domain: <Shield className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  Technical: "text-blue-600",
  HR: "text-rose-600",
  Aptitude: "text-amber-600",
  Domain: "text-violet-600",
};

export default function ChallengePage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const challengeId = params?.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [existingEntry, setExistingEntry] = useState<any>(null);
  const [error, setError] = useState("");

  // Flow state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ answerText: string }[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<"taking" | "results">("taking");
  const [resultEntry, setResultEntry] = useState<any>(null);
  const [newBadges, setNewBadges] = useState<any[]>([]);
  const [showBadgeToast, setShowBadgeToast] = useState(false);

  // Timer — use null initial value and set it lazily in useEffect to satisfy purity rules
  const startTimeRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) router.push("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  useEffect(() => {
    if (!isLoggedIn || !challengeId) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/arena/challenges/${challengeId}`);
        setChallenge(res.data.challenge);
        setAlreadyCompleted(res.data.alreadyCompleted);
        setExistingEntry(res.data.myEntry);
        setAnswers(new Array(res.data.challenge.questions.length).fill({ answerText: "" }));
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load challenge.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isLoggedIn, challengeId]);

  const handleNext = () => {
    if (!currentAnswer.trim()) return;
    const updated = [...answers];
    updated[currentQuestion] = { answerText: currentAnswer.trim() };
    setAnswers(updated);
    setCurrentAnswer("");
    if (currentQuestion < (challenge?.questions.length || 0) - 1) {
      setCurrentQuestion((q) => q + 1);
    } else {
      handleSubmit(updated);
    }
  };

  const handleSubmit = async (finalAnswers: { answerText: string }[]) => {
    try {
      setSubmitting(true);
      const timeTakenSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const res = await axiosInstance.post("/api/arena/challenges/submit", {
        challengeId,
        answers: finalAnswers,
        timeTakenSeconds,
      });
      setResultEntry(res.data.entry);
      const badges = res.data.newBadges || [];
      setNewBadges(badges);
      if (badges.length > 0) {
        setTimeout(() => setShowBadgeToast(true), 800);
        setTimeout(() => setShowBadgeToast(false), 5000);
      }
      setPhase("results");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setAlreadyCompleted(true);
      } else {
        setError(err?.response?.data?.message || "Submission failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading challenge...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Challenge Unavailable</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/arena"><Button className="rounded-full">← Back to Arena</Button></Link>
        </Card>
      </div>
    );
  }

  if (alreadyCompleted && !resultEntry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold">Already Completed!</h2>
          <p className="text-muted-foreground">You have already submitted this challenge. Check the leaderboard to see your standing.</p>
          {existingEntry && (
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-3xl font-black text-foreground">{existingEntry.totalScore}<span className="text-lg text-muted-foreground">/100</span></p>
              <p className="text-sm text-muted-foreground mt-1">Your Score</p>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Link href="/arena"><Button variant="outline" className="rounded-full">← Arena</Button></Link>
            <Link href={`/arena/leaderboard?challenge=${challengeId}`}><Button className="rounded-full">Leaderboard →</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === "results" && resultEntry) {
    const totalScore = resultEntry.totalScore;
    const scoreColor = totalScore >= 80 ? "text-green-500" : totalScore >= 60 ? "text-amber-500" : "text-red-500";

    return (
      <>
        {/* ── Floating Badge Toast ───────────────────────────── */}
        <AnimatePresence>
          {showBadgeToast && newBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed bottom-6 right-6 z-[100] bg-background/95 backdrop-blur-lg border border-amber-500/30 shadow-2xl rounded-2xl p-4 max-w-[300px]"
            >
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">🎉 Badge{newBadges.length > 1 ? "s" : ""} Earned!</p>
              <div className="flex flex-col gap-2">
                {newBadges.map((b) => (
                  <div key={b.id} className="flex items-center gap-2">
                    <span className="text-xl">{b.emoji}</span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 text-center border border-border/50 space-y-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center mx-auto">
                  <Trophy className="w-10 h-10 text-amber-500" />
                </div>
              </motion.div>
              <h1 className="text-2xl font-extrabold text-foreground">Challenge Complete!</h1>
              <div className={`text-6xl font-black ${scoreColor}`}>
                {totalScore}<span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <p className="text-muted-foreground">
                {totalScore >= 80 ? "Excellent performance! You're in great shape." :
                  totalScore >= 60 ? "Good effort! Room to grow further." :
                    "Keep practicing — every challenge makes you stronger!"}
              </p>
              {resultEntry.rank && (
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 text-sm font-semibold text-amber-600">
                  <Trophy className="w-4 h-4" /> Rank #{resultEntry.rank} on this challenge
                </div>
              )}
            </Card>
          </motion.div>

          {/* New badges */}
          {newBadges.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-6 border border-amber-500/20 bg-amber-500/5 space-y-3">
                <h2 className="font-bold text-foreground flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" /> New Badges Earned!
                </h2>
                <div className="flex flex-wrap gap-3">
                  {newBadges.map((b) => (
                    <motion.div
                      key={b.id}
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="flex items-center gap-2 bg-background border border-amber-500/30 rounded-full px-3 py-1.5 text-sm font-medium"
                    >
                      <span>{b.emoji}</span> {b.name}
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Per-question breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" /> Answer Breakdown
            </h2>
            <div className="space-y-4">
              {(resultEntry.answers || []).map((ans: AnswerScore, i: number) => {
                const sc = ans.score;
                const bar = sc >= 80 ? "bg-green-500" : sc >= 60 ? "bg-amber-500" : "bg-red-500";
                return (
                  <Card key={i} className="p-5 border border-border/50 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Question {i + 1}</p>
                        <p className="text-sm font-medium text-foreground">{ans.questionText}</p>
                      </div>
                      <span className={`text-2xl font-black flex-shrink-0 ${sc >= 80 ? "text-green-500" : sc >= 60 ? "text-amber-500" : "text-red-500"}`}>
                        {sc}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${bar}`} style={{ width: `${sc}%` }} />
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Your Answer</p>
                      <p className="text-sm text-foreground">{ans.answerText}</p>
                    </div>
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                      <p className="text-xs text-primary font-semibold mb-1">AI Feedback</p>
                      <p className="text-sm text-muted-foreground">{ans.aiFeedback}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </motion.div>

          <div className="flex gap-3 justify-center pt-2">
            <Link href="/arena"><Button variant="outline" className="rounded-full">← Back to Arena</Button></Link>
            <Link href={`/arena/leaderboard?challenge=${challengeId}`}><Button className="rounded-full">View Leaderboard →</Button></Link>
          </div>
        </div>
        </div>
      </>
    );
  }

  if (!challenge) return null;
  const progress = ((currentQuestion) / challenge.questions.length) * 100;
  const catColor = categoryColors[challenge.category] || "text-primary";
  const catIcon = categoryIcons[challenge.category];

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/arena">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-1" /> Arena
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-muted/50 rounded-full px-3 py-1.5 border border-border/50">
            <Clock className="w-4 h-4" /> {formatTime(elapsed)}
          </div>
        </div>

        {/* Challenge info */}
        <Card className="p-5 border border-border/50 bg-card">
          <div className={`flex items-center gap-2 text-sm font-semibold mb-2 ${catColor}`}>
            {catIcon} {challenge.category} · {challenge.type === "daily" ? "Daily" : "Weekly"} Challenge
          </div>
          <h1 className="text-xl font-extrabold text-foreground mb-1">{challenge.title}</h1>
          <p className="text-sm text-muted-foreground">{challenge.description}</p>
        </Card>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>Question {currentQuestion + 1} of {challenge.questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              className="h-2 rounded-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="p-6 border border-border/50 space-y-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  Question {currentQuestion + 1}
                </span>
                <p className="text-lg font-semibold text-foreground leading-snug">
                  {challenge.questions[currentQuestion].questionText}
                </p>
              </div>

              <Textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here... Be specific and thorough."
                className="min-h-[140px] resize-none rounded-xl border-border/60 text-sm"
                disabled={submitting}
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {currentAnswer.length} characters
                </span>
                <Button
                  onClick={handleNext}
                  disabled={!currentAnswer.trim() || submitting}
                  className="rounded-full font-semibold px-6"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Scoring...</>
                  ) : currentQuestion < challenge.questions.length - 1 ? (
                    <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                  ) : (
                    <>Submit Challenge <Trophy className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
