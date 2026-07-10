"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Target, Calendar, Clock, Lightbulb, Trash2, CheckCircle } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Interview {
  id: string;
  date: string;
  score: number;
  duration: number;
  topic: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState<string>("All");

  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [interviewDetails, setInterviewDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleClearAll = async () => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete("/api/interviews");
      setInterviews([]);
      setModalState((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error("Failed to clear history:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/api/interviews/${id}`);
      setInterviews((prev) => prev.filter((i) => i.id !== id));
      setModalState((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error("Failed to delete interview:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (!authLoading && isLoggedIn && user?.role === "admin") {
      router.push("/dashboard");
    }
  }, [isLoggedIn, authLoading, user, router]);

  useEffect(() => {
    const fetchInterviews = async () => {
      if (!isLoggedIn) return;
      try {
        const { data } = await axiosInstance.get("/api/interviews");
        setInterviews(data.interviews);
      } catch (error) {
        console.error("Failed to fetch interviews:", error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchInterviews();
  }, [isLoggedIn]);

  const handleRetake = (domain: string) => {
    router.push(`/interview?domain=${encodeURIComponent(domain)}`);
  };

  const handleViewDetails = async (id: string) => {
    setSelectedInterviewId(id);
    setDetailsLoading(true);
    setInterviewDetails(null);
    try {
      const { data } = await axiosInstance.get(`/api/interviews/${id}`);
      setInterviewDetails(data.interview);
    } catch (error) {
      console.error("Failed to fetch interview details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredInterviews =
    filterDomain === "All"
      ? interviews
      : interviews.filter((i) => i.topic === filterDomain);

  const uniqueDomains = Array.from(new Set(interviews.map((i) => i.topic)));

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background pt-8 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded-xl animate-pulse" />
              <div className="h-4 w-64 bg-muted rounded-lg animate-pulse" />
            </div>
            <div className="h-9 w-28 bg-muted rounded-full animate-pulse" />
          </div>
          {/* Filter skeleton */}
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 w-20 bg-muted rounded-full animate-pulse" />
            ))}
          </div>
          {/* Row skeletons */}
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div className="flex-1 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">
              My Sessions
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Review your past mock interviews, analyze your performance, and track your progress over time.
            </p>
          </div>
          {interviews.length > 0 && (
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hidden sm:flex shrink-0 rounded-full"
              onClick={() =>
                setModalState({
                  isOpen: true,
                  title: "Clear All History",
                  description: "Are you sure you want to permanently delete all your interview history? This action cannot be undone.",
                  isDanger: true,
                  onConfirm: handleClearAll,
                })
              }
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear History
            </Button>
          )}
        </section>

        <section>
          {interviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setFilterDomain("All")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filterDomain === "All"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/50"
                }`}
              >
                All
              </button>
              {uniqueDomains.map((domain) => (
                <button
                  key={domain}
                  onClick={() => setFilterDomain(domain)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterDomain === domain
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/50"
                  }`}
                >
                  {domain}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {interviews.length === 0 ? (
              <Card className="p-12 text-center border-border/50 bg-muted/10 border-dashed">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  No interviews yet
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                  You haven't completed any mock interviews. Start a practice
                  session to see your history here.
                </p>
                <Button
                  onClick={() => router.push("/practice")}
                  className="rounded-full bg-primary hover:opacity-90 text-white shadow-md font-semibold px-8"
                >
                  Start Practice
                </Button>
              </Card>
            ) : filteredInterviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No interviews found for {filterDomain}.
              </div>
            ) : (
              filteredInterviews.map((interview, index) => (
                <motion.div
                  key={interview.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-border/60 hover:border-primary/30 transition-colors bg-card hover:shadow-sm group">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary group-hover:bg-primary/20 transition-colors">
                        <Target className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-foreground truncate">
                            {interview.topic}
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              interview.score >= 80
                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                : interview.score >= 60
                                  ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                                  : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            {interview.score}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {new Date(interview.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {Math.floor(interview.duration / 60)} min
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <div className="hidden sm:block w-32 bg-muted rounded-full h-1.5 mr-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${interview.score}%` }}
                          transition={{ duration: 1, delay: 0.2 + index * 0.05 }}
                          className={`h-full rounded-full ${
                            interview.score >= 80
                              ? "bg-green-500"
                              : interview.score >= 60
                                ? "bg-yellow-500"
                                : "bg-orange-500"
                          }`}
                        />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(interview.id)}
                          className="flex-1 sm:flex-none rounded-full text-xs border-border/60 hover:bg-muted/50"
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRetake(interview.topic)}
                          className="flex-1 sm:flex-none rounded-full text-xs bg-primary/10 hover:bg-primary/20 text-primary border-0"
                        >
                          Retake
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setModalState({
                            isOpen: true,
                            title: "Delete Interview",
                            description: "Are you sure you want to delete this interview record?",
                            isDanger: true,
                            onConfirm: () => handleDeleteSingle(interview.id),
                          })}
                          className="w-8 h-8 p-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedInterviewId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedInterviewId(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-2xl"
            >
              <Card data-lenis-prevent className="w-full max-h-[85vh] overflow-y-auto p-6 border border-border shadow-2xl flex flex-col">
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-border/50">
                  <div>
                    <h2 className="text-xl font-black text-foreground mb-1">
                      Interview Details
                    </h2>
                    {interviewDetails && (
                      <p className="text-sm text-muted-foreground">
                        {interviewDetails.domain} • Score: {interviewDetails.score}%
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedInterviewId(null)}
                    className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {detailsLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading details…</p>
                  </div>
                ) : interviewDetails ? (
                  <div className="space-y-6">
                    {interviewDetails.feedback && (
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                        <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5" />
                          Final AI Feedback
                        </p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {interviewDetails.feedback}
                        </p>
                      </div>
                    )}

                    {interviewDetails.mentorFeedback && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Reviewed by {interviewDetails.reviewedBy?.name || "Mentor"}
                        </p>
                        <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">
                          {interviewDetails.mentorFeedback}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">
                        Conversation Log
                      </p>
                      <div className="space-y-4">
                        {interviewDetails.messages.map((msg: any, idx: number) => (
                          <div
                            key={idx}
                            className={`flex flex-col ${
                              msg.role === "user" ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-muted border border-border/50 text-foreground rounded-bl-sm shadow-sm"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Failed to load interview details.
                  </div>
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        description={modalState.description}
        isDanger={modalState.isDanger}
        onConfirm={modalState.onConfirm}
        onCancel={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        isLoading={deleteLoading}
        confirmText="Delete"
      />
    </div>
  );
}
