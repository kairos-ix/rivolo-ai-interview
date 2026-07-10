"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, MessageSquare, ChevronLeft, ChevronRight,
  User, Clock, Award, Send, Loader2, CheckCircle, X, ChevronDown, ChevronUp
} from "lucide-react";

interface Message {
  role: "ai" | "user";
  content: string;
  questionNumber?: number;
  scoreAwarded?: number;
  isSkipped?: boolean;
  difficulty?: string;
}

interface InterviewItem {
  _id: string;
  userId: { _id: string; name: string; email: string };
  domain: string;
  score: number;
  duration: number;
  questionsAnswered: number;
  feedback: string;
  mentorFeedback: string;
  reviewedBy: { _id: string; name: string } | null;
  isComplete: boolean;
  createdAt: string;
  messages: Message[];
}

export default function MentorDashboard() {
  const { isLoggedIn, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Feedback state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Route protection
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (!authLoading && isLoggedIn && user?.role !== "mentor" && user?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [authLoading, isLoggedIn, user, router]);

  useEffect(() => {
    if (isLoggedIn && (user?.role === "mentor" || user?.role === "admin")) {
      fetchInterviews(true);
    }
  }, [page, isLoggedIn, user?.role]);

  const fetchInterviews = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await axiosInstance.get(`/api/mentor/interviews?page=${page}&limit=10`);
      setInterviews(res.data.interviews);
      setTotalPages(res.data.pagination.pages || 1);
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to load interviews" });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSubmitFeedback = async (interviewId: string) => {
    if (!feedbackText.trim()) return;
    try {
      setSubmittingFeedback(true);
      await axiosInstance.post(`/api/mentor/interviews/${interviewId}/feedback`, {
        feedback: feedbackText
      });
      setMessage({ type: "success", text: "Feedback submitted successfully!" });
      setFeedbackText("");
      setExpandedId(null);
      await fetchInterviews();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to submit feedback" });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const toggleExpand = (id: string, existingFeedback: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setFeedbackText("");
    } else {
      setExpandedId(id);
      setFeedbackText(existingFeedback || "");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  if (authLoading || (!authLoading && isLoggedIn && user?.role !== "mentor" && user?.role !== "admin")) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background pt-8 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-10 w-64 bg-muted rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const reviewedCount = interviews.filter(i => i.mentorFeedback).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pt-8 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mentor Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Review student interviews and provide feedback</p>
        </div>

        {/* Feedback message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl border text-sm flex justify-between items-center ${
                message.type === "error"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              <span className="flex items-center gap-2">
                {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {message.text}
              </span>
              <button onClick={() => setMessage(null)} className="font-bold opacity-60 hover:opacity-100 ml-4">×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5 border-border/60">
            <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2 text-blue-500">
              <BookOpen className="w-4 h-4" /> Total Interviews
            </p>
            <h3 className="text-3xl font-black">{interviews.length}</h3>
          </Card>
          <Card className="p-5 border-border/60">
            <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2 text-green-500">
              <CheckCircle className="w-4 h-4" /> Reviewed
            </p>
            <h3 className="text-3xl font-black">{reviewedCount}</h3>
          </Card>
          <Card className="p-5 border-border/60">
            <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2 text-amber-500">
              <MessageSquare className="w-4 h-4" /> Pending Review
            </p>
            <h3 className="text-3xl font-black">{interviews.length - reviewedCount}</h3>
          </Card>
        </div>

        {/* Interviews List */}
        <Card className="border-border/60 overflow-visible">
          <div className="px-6 py-5 border-b border-border/50">
            <h2 className="text-lg font-bold">Student Interviews</h2>
          </div>

          <div className="divide-y divide-border/30">
            {loading ? (
              <div className="px-6 py-10 text-center text-muted-foreground">Loading interviews…</div>
            ) : interviews.length === 0 ? (
              <div className="px-6 py-10 text-center text-muted-foreground">
                No completed student interviews yet.
              </div>
            ) : (
              interviews.map((interview) => (
                <div key={interview._id} className="hover:bg-muted/20 transition-colors">
                  {/* Interview Row */}
                  <div
                    className="px-6 py-4 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpand(interview._id, interview.mentorFeedback)}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Student Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {interview.userId?.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">
                          {interview.userId?.name || "Unknown Student"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> {interview.domain}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {interview.duration || 0}m
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {interview.questionsAnswered} Q&A
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Score + Status + Expand */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getScoreColor(interview.score)}`}>
                        {interview.score}/100
                      </span>
                      {interview.mentorFeedback ? (
                        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          Reviewed
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                          Pending
                        </span>
                      )}
                      <span className="text-muted-foreground text-xs hidden sm:inline">
                        {new Date(interview.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {expandedId === interview._id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Panel */}
                  <AnimatePresence>
                    {expandedId === interview._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 space-y-5">
                          
                          {/* Q&A Transcript */}
                          {interview.messages && interview.messages.length > 0 && (() => {
                            // Pair up AI questions with the next user answer
                            const pairs: { q: Message; a: Message | null }[] = [];
                            const msgs = interview.messages;
                            for (let i = 0; i < msgs.length; i++) {
                              if (msgs[i].role === "ai" && msgs[i].questionNumber) {
                                const answer = msgs[i + 1]?.role === "user" ? msgs[i + 1] : null;
                                pairs.push({ q: msgs[i], a: answer || null });
                                if (answer) i++;
                              }
                            }
                            return pairs.length > 0 ? (
                              <div className="space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5" /> Interview Transcript ({pairs.length} Questions)
                                </p>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scroll">
                                  {pairs.map((pair, idx) => (
                                    <div key={idx} className="rounded-xl border border-border/50 overflow-hidden">
                                      {/* Question */}
                                      <div className="bg-muted/40 px-4 py-3 flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                          <span className="mt-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                            {pair.q.questionNumber}
                                          </span>
                                          <p className="text-sm text-foreground font-medium leading-relaxed">{pair.q.content}</p>
                                        </div>
                                        {pair.q.difficulty && (
                                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                            pair.q.difficulty === "hard" ? "bg-red-100 text-red-600" :
                                            pair.q.difficulty === "medium" ? "bg-amber-100 text-amber-600" :
                                            "bg-green-100 text-green-600"
                                          }`}>
                                            {pair.q.difficulty}
                                          </span>
                                        )}
                                      </div>
                                      {/* Answer */}
                                      <div className="px-4 py-3 bg-background flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                          <span className="mt-0.5 text-xs font-bold text-muted-foreground flex-shrink-0">A:</span>
                                          {pair.a ? (
                                            <p className={`text-sm leading-relaxed ${pair.a.isSkipped ? "text-muted-foreground italic" : "text-foreground/80"}`}>
                                              {pair.a.isSkipped ? "⏭ Skipped" : pair.a.content}
                                            </p>
                                          ) : (
                                            <p className="text-sm text-muted-foreground italic">No answer recorded</p>
                                          )}
                                        </div>
                                        {pair.a && pair.a.scoreAwarded !== undefined && (
                                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                            pair.a.scoreAwarded >= 8 ? "bg-green-100 text-green-700" :
                                            pair.a.scoreAwarded >= 5 ? "bg-amber-100 text-amber-700" :
                                            "bg-red-100 text-red-700"
                                          }`}>
                                            {pair.a.scoreAwarded}/10
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          })()}

                          {/* AI Feedback */}
                          {interview.feedback && (
                            <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">AI Feedback</p>
                              <p className="text-sm text-foreground/80 whitespace-pre-line">{interview.feedback}</p>
                            </div>
                          )}

                          {/* Existing Mentor Feedback */}
                          {interview.mentorFeedback && interview.reviewedBy && (
                            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                              <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" /> Reviewed by {interview.reviewedBy.name}
                              </p>
                              <p className="text-sm text-green-800 whitespace-pre-line">{interview.mentorFeedback}</p>
                            </div>
                          )}

                          {/* Feedback Input */}
                          <div className="space-y-3 border-t border-border/30 pt-4">
                            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                              <MessageSquare className="w-4 h-4 text-primary" />
                              {interview.mentorFeedback ? "Update Your Feedback" : "Write Feedback"}
                            </label>
                            <textarea
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              placeholder="Provide constructive feedback on the student's performance, strengths, and areas for improvement..."
                              rows={4}
                              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                            />
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleSubmitFeedback(interview._id)}
                                disabled={submittingFeedback || !feedbackText.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                {submittingFeedback ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                                ) : (
                                  <><Send className="w-4 h-4" /> Submit Feedback</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
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
    </div>
  );
}
