"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, HelpCircle, CheckCircle2, XCircle, ChevronRight, ChevronLeft, Flag } from "lucide-react";

export default function RecruiterInterviewPage() {
  const COMPANY_PASSING_BARS: Record<string, number> = {
    google: 75, amazon: 72, meta: 78, microsoft: 68, startup: 60,
    tcs: 55, infosys: 52, wipro: 50, anthropic: 80, openai: 78,
    deepmind: 82, tesla: 74, spacex: 76, jpmorgan: 65, goldman: 78,
    apple: 70, netflix: 80, uber: 68, nvidia: 78, xai: 82
  };
  const { sessionId } = useParams();
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // State for intermediate feedback
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [showNextButton, setShowNextButton] = useState(false);
  const [tempNextQuestion, setTempNextQuestion] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/recruiter/session/${sessionId}`);
      setSession(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSession();
  }, [isLoggedIn, sessionId, router, fetchSession]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [lastFeedback]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Session Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/recruiter")}>Back to Simulator</Button>
        </div>
      </div>
    );
  }

  const currentQ = session.questions[session.currentQuestionIndex];
  const isCompleted = session.status === "completed";

  const handleSubmit = async (skip: boolean = false) => {
    if (!skip && !answer.trim()) return;

    try {
      setSubmitting(true);
      const res = await axiosInstance.post("/api/recruiter/answer", {
        sessionId,
        answerText: answer,
        skip
      });

      setLastFeedback(res.data.answerFeedback);
      setLastScore(res.data.answerScore);

      if (res.data.sessionComplete) {
        setSession({
          ...session,
          status: "completed",
          finalScore: res.data.finalScore,
          meetsCompanyBar: res.data.meetsCompanyBar,
          companyFeedback: res.data.companyFeedback,
          answers: [...session.answers, { score: res.data.answerScore, feedback: res.data.answerFeedback, questionIndex: session.currentQuestionIndex }]
        });
      } else {
        setTempNextQuestion(res.data.nextQuestion);
        setShowNextButton(true);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setSession({
      ...session,
      currentQuestionIndex: session.currentQuestionIndex + 1,
      questions: [...session.questions, tempNextQuestion],
      answers: [...session.answers, { score: lastScore, feedback: lastFeedback, questionIndex: session.currentQuestionIndex }]
    });
    setAnswer("");
    setShowHint(false);
    setLastFeedback(null);
    setLastScore(null);
    setShowNextButton(false);
    setTempNextQuestion(null);
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === "easy") return "bg-green-500/10 text-green-600 border-green-500/20";
    if (diff === "medium") return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    return "bg-red-500/10 text-red-600 border-red-500/20";
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-card border border-border/50 rounded-2xl p-4 shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/recruiter")} className="mr-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                {session.companyName} Simulator
              </h1>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {session.candidateType} • {session.companyType}
              </p>
            </div>
          </div>
          {!isCompleted && (
            <div className="flex items-center gap-4 bg-muted/50 px-4 py-2 rounded-xl border border-border/50">
               <div>
                 <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Passing Bar</p>
                 <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                   <Flag className="w-4 h-4 text-primary" /> {COMPANY_PASSING_BARS[session.companyId] || 60}/100
                 </p>
               </div>
            </div>
          )}
        </div>

        {!isCompleted ? (
          <AnimatePresence mode="wait">
            {!lastFeedback ? (
              <motion.div key="question" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="p-6 sm:p-8 border-border/50 shadow-sm space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                      Question {session.currentQuestionIndex + 1} of {session.totalQuestions}
                    </span>
                    <div className="flex gap-2">
                      <span className="text-xs font-semibold bg-muted text-muted-foreground px-2.5 py-1 rounded-md">
                        {currentQ.category}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getDifficultyColor(currentQ.difficulty)}`}>
                        {currentQ.difficulty.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground leading-snug">
                    {currentQ.text}
                  </h2>

                  {currentQ.hint && (
                    <div className="mt-4">
                      <button 
                        onClick={() => setShowHint(!showHint)}
                        className="text-sm font-medium text-primary flex items-center gap-1.5 hover:underline"
                      >
                        <HelpCircle className="w-4 h-4" /> Need a hint?
                      </button>
                      {showHint && (
                        <div className="mt-2 p-3 bg-primary/5 text-primary rounded-lg text-sm border border-primary/10">
                          {currentQ.hint}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4">
                    <Textarea 
                      placeholder="Type your answer here..."
                      value={answer}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
                      className="min-h-[180px] text-base resize-y bg-muted/30 focus:bg-background transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button 
                      variant="ghost" 
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleSubmit(true)}
                      disabled={submitting}
                    >
                      Skip Question
                    </Button>
                    <Button 
                      onClick={() => handleSubmit(false)}
                      disabled={!answer.trim() || submitting}
                      className="px-8 rounded-full font-semibold"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {submitting ? "Evaluating..." : "Submit Answer"}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div key="feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="p-6 sm:p-8 border-border/50 shadow-sm" ref={scrollRef}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8 border-b border-border/50 pb-6">
                    <div>
                      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Evaluation</h3>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                          (lastScore ?? 0) >= 60 ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-orange-500/10 text-orange-600 border border-orange-500/20"
                        }`}>
                          {lastScore}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Answer Score</p>
                          <p className="text-xs text-muted-foreground">Out of 100</p>
                        </div>
                      </div>
                    </div>
                    {showNextButton && (
                      <Button onClick={handleNextQuestion} className="rounded-full pl-6 pr-4">
                        Next Question <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:text-foreground prose-pre:border prose-pre:border-border/50">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {lastFeedback || ""}
                    </ReactMarkdown>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <Card className="p-8 border-border/50 shadow-md text-center overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary"></div>
              
              <div className="mb-8 pt-4">
                <h2 className="text-3xl font-extrabold text-foreground mb-2">Interview Completed</h2>
                <p className="text-muted-foreground">Final hiring verdict from {session.companyName}</p>
              </div>

              <div className="flex flex-col items-center justify-center mb-10">
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" className="stroke-muted" strokeWidth="8" />
                    <circle 
                      cx="60" cy="60" r="54" fill="none" strokeWidth="8"
                      className={session.meetsCompanyBar ? "stroke-green-500" : "stroke-red-500"}
                      strokeDasharray={2 * Math.PI * 54}
                      strokeDashoffset={(2 * Math.PI * 54) - ((session.finalScore || 0) / 100) * (2 * Math.PI * 54)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{session.finalScore}</span>
                  </div>
                </div>
                
                {session.meetsCompanyBar ? (
                  <div className="flex items-center gap-2 bg-green-500/10 text-green-600 border border-green-500/20 px-6 py-2 rounded-full font-bold text-lg">
                    <CheckCircle2 className="w-5 h-5" /> Selected
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-red-500/10 text-red-600 border border-red-500/20 px-6 py-2 rounded-full font-bold text-lg">
                    <XCircle className="w-5 h-5" /> Not Selected
                  </div>
                )}
              </div>

              <div className="text-left bg-muted/30 rounded-2xl p-6 border border-border/50">
                <h3 className="text-lg font-bold text-foreground mb-4 border-b border-border/50 pb-2">Hiring Committee Feedback</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground prose-pre:bg-muted/50 prose-pre:text-foreground prose-pre:border prose-pre:border-border/50">
                  <ReactMarkdown>{session.companyFeedback || ""}</ReactMarkdown>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-8">
                <Button variant="outline" onClick={() => router.push("/recruiter")}>Try Another Company</Button>
                <Button onClick={() => router.push("/recruiter/history")}>View History</Button>
              </div>
            </Card>

            <h3 className="text-lg font-bold text-foreground px-1 mt-8 mb-4">Question Breakdown</h3>
            <div className="space-y-3">
              {session.answers.map((ans: any, idx: number) => {
                const q = session.questions[ans.questionIndex];
                return (
                  <Card key={idx} className="p-4 border border-border/50 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Q{idx + 1} • {q.category}</p>
                      <p className="text-sm font-medium text-foreground line-clamp-1 max-w-lg">{q.text}</p>
                    </div>
                    <div className={`font-bold text-lg ${ans.score >= 60 ? "text-green-500" : "text-red-500"}`}>
                      {ans.score}/100
                    </div>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
