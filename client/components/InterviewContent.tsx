"use client";
import ChatContainer from "@/components/ChatContainer";
import { InputBox } from "@/components/InputBox";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileJson, Atom, Code, BarChart, Settings, 
  Server, Database, Target, Rocket, Dumbbell, 
  Star, Clock, PartyPopper, HelpCircle, Timer, 
  RefreshCw, Lightbulb, Shield, Lock, Wifi
} from "lucide-react";
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}
interface InterviewSession {
  id: string;
  score?: number;
  feedback?: string;
  isComplete?: boolean;
}

const TOTAL_QUESTIONS = 3;

const domainEmoji: Record<string, React.ReactNode> = {
  JavaScript: <FileJson className="w-5 h-5" />,
  "JavaScript/Node.js": <FileJson className="w-5 h-5" />,
  React: <Atom className="w-5 h-5" />,
  Python: <Code className="w-5 h-5" />,
  "Data Science": <BarChart className="w-5 h-5" />,
  DevOps: <Settings className="w-5 h-5" />,
  "System Design": <Server className="w-5 h-5" />,
  "Database Design": <Database className="w-5 h-5" />,
  Cybersecurity: <Shield className="w-5 h-5" />,
  "Ethical Hacking": <Lock className="w-5 h-5" />,
  "Network Security": <Wifi className="w-5 h-5" />,
  General: <Target className="w-5 h-5" />,
};
const InterviewContent = () => {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") || "General";
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [interviewScore, setInterviewScore] = useState<number | null>(null);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [serverWaking, setServerWaking] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (isLoggedIn) {
      const activeSessionId = sessionStorage.getItem("activeInterviewSessionId");
      if (activeSessionId) {
        resumeInterview(activeSessionId);
      } else {
        startInterview();
      }
    }
  }, [isLoggedIn]);

  const resumeInterview = async (id: string) => {
    try {
      setIsLoading(true);
      const { data } = await axiosInstance.get(`/api/interviews/${id}`);
      if (data && data.interview && !data.interview.isComplete && data.interview.domain === domain) {
        setSessionId(data.interview._id);
        setQuestionsAnswered(data.interview.questionsAnswered || 0);
        
        const mappedMessages = data.interview.messages.map((m: any, i: number) => ({
          id: m._id || i.toString(),
          content: m.content,
          isUser: m.role === "user",
          timestamp: new Date(m.timestamp || data.interview.createdAt),
        }));
        setMessages(mappedMessages);
        
        const storedStartTime = sessionStorage.getItem("interviewStartTime");
        if (storedStartTime) {
          const elapsed = Math.floor((Date.now() - parseInt(storedStartTime, 10)) / 1000);
          setElapsedSeconds(elapsed > 0 ? elapsed : 0);
        }
      } else {
        sessionStorage.removeItem("activeInterviewSessionId");
        sessionStorage.removeItem("interviewStartTime");
        startInterview();
      }
    } catch (error) {
      console.error("Failed to resume session", error);
      sessionStorage.removeItem("activeInterviewSessionId");
      sessionStorage.removeItem("interviewStartTime");
      startInterview();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isInterviewComplete) return;
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isInterviewComplete]);

  // Auto-retry countdown
  useEffect(() => {
    if (retryCountdown <= 0) return;
    const t = setInterval(() => {
      setRetryCountdown((c) => {
        if (c <= 1) {
          startInterview();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [retryCountdown]);

  const startInterview = async () => {
    try {
      setIsLoading(true);
      setServerWaking(false);
      const { data } = await axiosInstance.post("/api/interviews/start", {
        domain,
      });
      if (data) {
        setSessionId(data.sessionId);
        sessionStorage.setItem("activeInterviewSessionId", data.sessionId);
        sessionStorage.setItem("interviewStartTime", Date.now().toString());
        setQuestionsAnswered(0);
        setRetryAttempt(0);
        setServerWaking(false);
        setElapsedSeconds(0);
        setMessages([
          {
            id: "1",
            content: data.question || "Tell me about yourself",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error: any) {
      const attempt = retryAttempt + 1;
      setRetryAttempt(attempt);
      setServerWaking(true);
      setMessages([]);
      // Auto-retry with increasing delay (10s, 15s, 20s...)
      if (attempt <= 5) {
        setRetryCountdown(10 + (attempt - 1) * 5);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || !sessionId) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: userMessage,
        isUser: true,
        timestamp: new Date(),
      },
    ]);
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post(
        "/api/interviews/submit-answer",
        { sessionId, answer: userMessage, domain, questionsAnswered },
      );
      if (data) {
        if (data.questionsAnswered !== undefined) {
          setQuestionsAnswered(data.questionsAnswered);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content:
              data.feedback ||
              "Good answer! Your response demonstrates solid understanding",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        if (data.isComplete || (data.questionsAnswered !== undefined && data.questionsAnswered >= TOTAL_QUESTIONS)) {
          setInterviewScore(data.score || 75);
          setIsInterviewComplete(true);
          sessionStorage.removeItem("activeInterviewSessionId");
          sessionStorage.removeItem("interviewStartTime");
        } else if (data.nextQuestion) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: (Date.now() + 2).toString(),
                content: data.nextQuestion,
                isUser: false,
                timestamp: new Date(),
              },
            ]);
          }, 500);
        }
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.message;
      let errorContent = "The server is waking up or there is a network issue. Please wait 30 seconds and try sending your answer again!";
      if (status === 429) {
        errorContent = serverMsg || "You're going too fast! Please wait a moment before answering.";
      } else if (status) {
        errorContent = serverMsg || "Connection error. Please try again.";
      }
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: errorContent,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleEndInterview = () => {
    sessionStorage.removeItem("activeInterviewSessionId");
    sessionStorage.removeItem("interviewStartTime");
    router.push("/dashboard");
  };
  if (authLoading) return null;
  if (!isLoggedIn) return null;
  const score = interviewScore ?? 0;
  const scoreLabel =
    score >= 80
      ? {
          text: <span className="flex items-center gap-2">Excellent! You're interview-ready <Rocket className="w-4 h-4" /></span>,
          color: "text-green-600 dark:text-green-400",
        }
      : score >= 60
        ? {
            text: <span className="flex items-center gap-2">Good effort! A few more sessions will get you there <Dumbbell className="w-4 h-4" /></span>,
            color: "text-blue-600 dark:text-blue-400",
          }
        : {
            text: <span className="flex items-center gap-2">Keep practicing! Every session makes you stronger <Star className="w-4 h-4" /></span>,
            color: "text-orange-600 dark:text-orange-400",
          };
  return (
    
    <div className="h-[calc(100dvh-4rem)] bg-background flex flex-col">
      {/* Sticky Header */}
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Domain info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                {domainEmoji[domain] || <Target className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-foreground truncate">
                    {domain} Interview
                  </h1>
                  {!isInterviewComplete && (
                    <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  AI Mock Interview Session
                </p>
              </div>
            </div>

            {/* Center: Progress */}
            {!isInterviewComplete && (
              <div className="hidden sm:flex flex-col items-center gap-1.5">
                <ProgressDots
                  current={questionsAnswered}
                  total={TOTAL_QUESTIONS}
                />
                <p className="text-xs text-muted-foreground">
                  Question {Math.min(questionsAnswered + 1, TOTAL_QUESTIONS)} of{" "}
                  {TOTAL_QUESTIONS}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isInterviewComplete && (
                <div className="hidden sm:flex items-center gap-1.5 bg-muted/50 border border-border/60 px-3 py-1.5 rounded-full">
                  <span className="text-muted-foreground"><Clock className="w-3.5 h-3.5" /></span>
                  <span className="text-sm font-mono font-semibold text-foreground tabular-nums">
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  isInterviewComplete
                    ? handleEndInterview()
                    : setShowExitConfirm(true)
                }
                className="rounded-full text-xs border-border/60 hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
              >
                {isInterviewComplete ? "Go to Dashboard" : "Exit"}
              </Button>
            </div>
          </div>
          {!isInterviewComplete && (
            <div className="sm:hidden mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>
                  Q{Math.min(questionsAnswered + 1, TOTAL_QUESTIONS)} of{" "}
                  {TOTAL_QUESTIONS}
                </span>
                <span className="font-mono">{formatTime(elapsedSeconds)}</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{
                    width: `${(questionsAnswered / TOTAL_QUESTIONS) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col w-full relative min-h-0 overflow-hidden">
        {isInterviewComplete ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin">
            <div className="w-full max-w-4xl mx-auto pb-8 flex flex-col justify-center min-h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                
                {/* Left Column: Score */}
                <div className="space-y-5">
                  <Card className="p-8 border border-border/60 text-center h-full flex flex-col justify-center">
                    <div className="text-3xl mb-3 flex justify-center text-primary"><PartyPopper className="w-8 h-8" /></div>
                    <h2 className="text-2xl font-black text-foreground mb-1">
                      Interview Complete!
                    </h2>
                    <p className="text-sm text-muted-foreground mb-8">
                      Here's how you performed
                    </p>

                    <ScoreRing score={score} />

                    <p className={`text-sm font-semibold mt-6 ${scoreLabel.color}`}>
                      {scoreLabel.text}
                    </p>
                  </Card>
                </div>

                {/* Right Column: Details & Actions */}
                <div className="space-y-5">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Questions", value: questionsAnswered, icon: <HelpCircle className="w-5 h-5 text-primary" /> },
                      {
                        label: "Domain",
                        value: domain.split("/")[0],
                        icon: domainEmoji[domain] || <Target className="w-5 h-5 text-primary" />,
                      },
                      {
                        label: "Duration",
                        value: formatTime(elapsedSeconds),
                        icon: <Timer className="w-5 h-5 text-primary" />,
                      },
                    ].map((stat, i) => (
                      <Card
                        key={i}
                        className="p-4 text-center border border-border/50"
                      >
                        <div className="text-lg mb-1 flex justify-center">{stat.icon}</div>
                        <p className="text-base font-bold text-foreground">
                          {stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                          {stat.label}
                        </p>
                      </Card>
                    ))}
                  </div>

                  {/* Score breakdown */}
                  <Card className="p-6 border border-border/50">
                    <p className="text-sm font-semibold text-foreground mb-4">
                      Performance Breakdown
                    </p>
                    {[
                      {
                        label: "Technical Accuracy",
                        pct: Math.min(score + 5, 100),
                      },
                      {
                        label: "Communication Clarity",
                        pct: Math.max(score - 8, 0),
                      },
                      {
                        label: "Problem-Solving Approach",
                        pct: Math.min(score + 2, 100),
                      },
                    ].map((bar, i) => (
                      <div key={i} className="mb-3 last:mb-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{bar.label}</span>
                          <span className="font-semibold text-foreground">
                            {bar.pct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-1000"
                            style={{ width: `${bar.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </Card>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsInterviewComplete(false);
                        setInterviewScore(null);
                        setQuestionsAnswered(0);
                        setMessages([]);
                        setElapsedSeconds(0);
                        sessionStorage.removeItem("activeInterviewSessionId");
                        sessionStorage.removeItem("interviewStartTime");
                        startInterview();
                      }}
                      className="rounded-full border-border/60"
                    >
                      <span className="flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Try Again</span>
                    </Button>
                    <Button
                      onClick={handleEndInterview}
                      className="rounded-full bg-primary hover:opacity-90 text-white font-semibold"
                    >
                      Dashboard →
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : serverWaking ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-sm space-y-6"
            >
              {/* Animated server icon */}
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="relative w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                  <Server className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">Waking up the server...</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our free-tier server goes to sleep after inactivity. It's booting up now — this is completely normal!
                </p>
              </div>

              {/* Countdown */}
              {retryCountdown > 0 && (
                <div className="space-y-3">
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: retryCountdown, ease: "linear" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Retrying automatically in <span className="font-bold text-foreground">{retryCountdown}s</span>
                    <span className="text-muted-foreground/60"> · Attempt {retryAttempt}/5</span>
                  </p>
                </div>
              )}

              {retryAttempt >= 5 && retryCountdown === 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Server is taking longer than usual. You can try again manually.
                  </p>
                  <Button
                    onClick={() => { setRetryAttempt(0); startInterview(); }}
                    className="rounded-full bg-primary text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry Now
                  </Button>
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-primary">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          <>
            <ChatContainer messages={messages} isLoading={isLoading} />
            <InputBox onSend={handleSendMessage} disabled={isLoading} />
          </>
        )}
      </div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Card className="w-full max-w-md p-6 border-border/60 shadow-xl">
                <h3 className="text-xl font-bold text-foreground mb-2">End Interview?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Are you sure you want to exit? Your progress for this session will not be saved.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowExitConfirm(false)}
                    className="rounded-full border-border/60"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleEndInterview}
                    className="rounded-full"
                  >
                    Exit Interview
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#3b82f6" : "#f97316";

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-border"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
          Score
        </span>
      </div>
    </div>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-500 ${
            i < current
              ? "bg-primary w-6"
              : i === current
                ? "bg-primary/40 w-4 animate-pulse"
                : "bg-border w-2"
          }`}
        />
      ))}
    </div>
  );
}
export default InterviewContent;
