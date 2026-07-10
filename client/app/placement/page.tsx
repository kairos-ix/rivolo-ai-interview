"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Target, AlertTriangle, BookOpen,
  Award, Briefcase, Code, Lightbulb, RefreshCw,
  Save, Loader2, Sparkles, ChevronRight
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

interface WeakArea {
  topic: string;
  score: number;
}

interface Roadmap {
  technologies: string[];
  projects: string[];
  certifications: string[];
  interviewTopics: string[];
}

interface ScoringConfig {
  interviewWeight: number;
  resumeWeight: number;
  skillBreadthWeight: number;
}

interface HistoryEntry {
  date: string;
  score: number;
  classification: string;
}

interface PlacementData {
  _id: string;
  candidateType: string;
  overallScore: number;
  classification: string;
  weakAreas: WeakArea[];
  communicationGaps: string[];
  missingSkills: string[];
  roadmap: Roadmap;
  scoringConfig: ScoringConfig;
  history: HistoryEntry[];
}

const CANDIDATE_TYPES = [
  { value: "fresher", label: "Fresher" },
  { value: "internship", label: "Internship" },
  { value: "experienced", label: "Experienced" },
];

export default function PlacementPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<PlacementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [candidateType, setCandidateType] = useState("fresher");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState("");
  const [generateError, setGenerateError] = useState("");

  // Scoring config local state
  const [iw, setIw] = useState(50);
  const [rw, setRw] = useState(30);
  const [sw, setSw] = useState(20);

  const fetchReadiness = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await axiosInstance.get("/api/placement");
      setData(res);
      setCandidateType(res.candidateType || "fresher");
      setIw(res.scoringConfig?.interviewWeight ?? 50);
      setRw(res.scoringConfig?.resumeWeight ?? 30);
      setSw(res.scoringConfig?.skillBreadthWeight ?? 20);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReadiness();
  }, [isLoggedIn, router, fetchReadiness]);

  const handleGenerate = async (type?: string) => {
    try {
      setGenerating(true);
      setGenerateError("");
      const { data: res } = await axiosInstance.post("/api/placement/generate", {
        candidateType: type || candidateType,
      });
      setData(res);
      setCandidateType(res.candidateType || "fresher");
      setIw(res.scoringConfig?.interviewWeight ?? 50);
      setRw(res.scoringConfig?.resumeWeight ?? 30);
      setSw(res.scoringConfig?.skillBreadthWeight ?? 20);
    } catch (err: any) {
      setGenerateError(err?.response?.data?.message || err.message || "Failed to analyze readiness.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveConfig = async () => {
    const sum = iw + rw + sw;
    if (sum !== 100) {
      setConfigError(`Weights must sum to 100 (currently ${sum})`);
      return;
    }
    setConfigError("");
    try {
      setSavingConfig(true);
      await axiosInstance.patch("/api/placement/config", {
        interviewWeight: iw,
        resumeWeight: rw,
        skillBreadthWeight: sw,
      });
      // Auto-regenerate after config save
      await handleGenerate();
    } catch (err: any) {
      setConfigError(err?.response?.data?.message || "Failed to save config");
    } finally {
      setSavingConfig(false);
    }
  };

  const getClassificationColor = (c: string) => {
    if (c === "Placement Ready") return { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-500/30", ring: "stroke-green-500" };
    if (c === "High Potential Candidate") return { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/30", ring: "stroke-amber-500" };
    return { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/30", ring: "stroke-red-500" };
  };

  const barColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

  // ── Loading skeleton ─────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background pt-8 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-10 w-64 bg-muted rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────
  if (!data) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background pt-8 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center text-center pt-8 space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"
          >
            <TrendingUp className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Placement Readiness</h1>
          <p className="text-muted-foreground max-w-md">
            Analyze your interview performance across all domains and get a personalized
            roadmap to become placement-ready.
          </p>

          {/* Candidate type selector */}
          <div className="flex gap-2 bg-muted/50 rounded-full p-1 border border-border/50">
            {CANDIDATE_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setCandidateType(t.value)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  candidateType === t.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {generateError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-destructive/10 text-destructive p-4 rounded-xl text-sm border border-destructive/20"
            >
              <div className="flex items-start gap-3 text-left">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Analysis Failed</p>
                  <p className="text-destructive/80 mb-3">{generateError}</p>
                  {generateError.includes("No completed interviews") && (
                    <Button 
                      onClick={() => router.push("/practice")}
                      size="sm" 
                      className="bg-destructive hover:bg-destructive/90 text-white"
                    >
                      Start an Interview
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <Button
            onClick={() => handleGenerate()}
            disabled={generating}
            className="rounded-full px-8 py-3 bg-primary hover:opacity-90 text-primary-foreground font-semibold text-base"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Analyze My Readiness
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ── Data loaded ───────────────────────────────────────
  const colors = getClassificationColor(data.classification);
  const scorePercent = data.overallScore;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (scorePercent / 100) * circumference;

  const weakAreaChartData = (data.weakAreas || []).map(w => ({
    name: w.topic,
    score: w.score,
  }));

  const historyChartData = (data.history || []).map(h => ({
    date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: h.score,
  }));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pt-8 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ── Header ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Placement Readiness</h1>
            <p className="text-sm text-muted-foreground mt-1">AI-powered analysis of your interview performance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-muted/50 rounded-full p-1 border border-border/50">
              {CANDIDATE_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => {
                    setCandidateType(t.value);
                    handleGenerate(t.value);
                  }}
                  disabled={generating}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    candidateType === t.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Button
              onClick={() => handleGenerate()}
              disabled={generating}
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Regenerate
            </Button>
          </div>
        </motion.div>

        {generateError && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm border border-destructive/20 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{generateError}</p>
          </div>
        )}

        {/* ── Generating overlay ──────────────────────────── */}
        <AnimatePresence>
          {generating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-lg font-semibold text-foreground">Analyzing your readiness...</p>
                <p className="text-sm text-muted-foreground">This may take a few seconds</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Row 1: Score Ring + Classification ──────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 sm:p-8 border border-border/50">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Score Ring */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    strokeWidth="8" strokeLinecap="round"
                    className={colors.ring}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-foreground">{scorePercent}</span>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Score</span>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-3">
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                  <Award className="w-4 h-4" />
                  {data.classification}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  {data.classification === "Placement Ready"
                    ? "Excellent! You're well-prepared for placement interviews. Keep sharpening your skills."
                    : data.classification === "High Potential Candidate"
                      ? "Good progress! Focus on the areas below to reach placement readiness."
                      : "Keep practicing! Follow the roadmap below to build your skills systematically."}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Row 2: Weak Areas, Communication Gaps, Missing Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Weak Areas */}
          <Card className="p-5 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Weak Areas</h3>
            </div>
            {weakAreaChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weakAreaChartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={16}>
                    {weakAreaChartData.map((_, i) => (
                      <Cell key={i} fill={barColors[i % barColors.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No weak areas identified.</p>
            )}
          </Card>

          {/* Communication Gaps */}
          <Card className="p-5 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Communication Gaps</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(data.communicationGaps || []).length > 0 ? (
                data.communicationGaps.map((gap, i) => (
                  <span key={i} className="text-xs bg-amber-500/10 text-amber-700 border border-amber-500/20 px-3 py-1.5 rounded-full font-medium">
                    {gap}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No gaps identified.</p>
              )}
            </div>
          </Card>

          {/* Missing Skills */}
          <Card className="p-5 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Missing Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(data.missingSkills || []).length > 0 ? (
                data.missingSkills.map((skill, i) => (
                  <span key={i} className="text-xs bg-blue-500/10 text-blue-700 border border-blue-500/20 px-3 py-1.5 rounded-full font-medium">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No missing skills identified.</p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── Row 3: Roadmap ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Improvement Roadmap
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Technologies", icon: <Code className="w-4 h-4" />, items: data.roadmap?.technologies, color: "text-blue-500" },
              { title: "Projects", icon: <Briefcase className="w-4 h-4" />, items: data.roadmap?.projects, color: "text-green-500" },
              { title: "Certifications", icon: <Award className="w-4 h-4" />, items: data.roadmap?.certifications, color: "text-amber-500" },
              { title: "Interview Topics", icon: <Lightbulb className="w-4 h-4" />, items: data.roadmap?.interviewTopics, color: "text-purple-500" },
            ].map((section, idx) => (
              <Card key={idx} className="p-5 border border-border/50">
                <div className={`flex items-center gap-2 mb-3 ${section.color}`}>
                  {section.icon}
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{section.title}</h3>
                </div>
                <ol className="space-y-2">
                  {(section.items || []).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* ── Row 4: Score History ────────────────────────── */}
        {historyChartData.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-5 border border-border/50">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Score History
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={historyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        )}

        {/* ── Row 5: Scoring Config ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-5 border border-border/50">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Scoring Configuration
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Adjust how your readiness score is calculated. Weights must sum to 100.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {[
                { label: "Interview Weight", value: iw, setter: setIw },
                { label: "Resume Weight", value: rw, setter: setRw },
                { label: "Skill Breadth Weight", value: sw, setter: setSw },
              ].map((field, idx) => (
                <div key={idx}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">{field.label}</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={field.value}
                    onChange={(e) => field.setter(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${iw + rw + sw === 100 ? "text-green-600" : "text-red-500"}`}>
                  Sum: {iw + rw + sw}/100
                </span>
                {configError && <span className="text-xs text-red-500">{configError}</span>}
              </div>
              <Button
                onClick={handleSaveConfig}
                disabled={savingConfig || iw + rw + sw !== 100}
                size="sm"
                className="rounded-full gap-1.5"
              >
                {savingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save & Regenerate
              </Button>
            </div>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
