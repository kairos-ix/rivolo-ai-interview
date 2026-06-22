"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Code, Atom, FileJson, BarChart, Settings, 
  Server, Database, Target, Shield, Lock, 
  Wifi, CheckCircle, TrendingUp, Lightbulb, 
  FileText, Activity, BrainCircuit, AlertTriangle, Brain,
  CloudUpload, Search, Zap, Wrench, Trash2
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from "recharts";
import { Modal } from "@/components/ui/modal";

interface Interview {
  id: string;
  date: string;
  score: number;
  duration: number;
  topic: string;
}

interface ResumeAnalysis {
  summary: string;
  strengths: string[];
  recommendedDomains: { label: string; reason: string; confidence: number }[];
  experienceLevel: "Junior" | "Mid" | "Senior";
  skillsDetected: string[];
  areasForImprovement?: string[];
}

const INTERVIEW_DOMAINS = [
  {
    label: "JavaScript/Node.js",
    icon: <FileJson className="w-5 h-5 text-yellow-500" />,
    desc: "ES6+, async, Node runtime",
  },
  { label: "React", icon: <Atom className="w-5 h-5 text-blue-400" />, desc: "Hooks, state, lifecycle" },
  { label: "Python", icon: <Code className="w-5 h-5 text-blue-500" />, desc: "OOP, data structures, stdlib" },
  { label: "Data Science", icon: <BarChart className="w-5 h-5 text-green-500" />, desc: "ML, pandas, statistics" },
  { label: "DevOps", icon: <Settings className="w-5 h-5 text-gray-500" />, desc: "CI/CD, Docker, Kubernetes" },
  { label: "System Design", icon: <Server className="w-5 h-5 text-indigo-500" />, desc: "Scalability, architecture" },
  { label: "Database Design", icon: <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />, desc: "SQL, NoSQL, indexing" },
  { label: "Cybersecurity", icon: <Shield className="w-5 h-5 text-red-500" />, desc: "Network security, cryptography" },
  { label: "Ethical Hacking", icon: <Lock className="w-5 h-5 text-orange-500" />, desc: "Vulnerability assessment" },
  { label: "Network Security", icon: <Wifi className="w-5 h-5 text-cyan-500" />, desc: "Firewalls, VPNs, IDS" },
  { label: "General", icon: <Target className="w-5 h-5 text-primary" />, desc: "Behavioural & fundamentals" },
];
function ResumePanel({
  onDomainSelect,
}: {
  onDomainSelect: (d: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "analyzing" | "results">(
    "upload",
  );
  const [analyzingStep, setAnalyzingStep] = useState(0);

  const analyzingSteps = [
    "Reading your resume…",
    "Detecting skills & technologies…",
    "Mapping to interview domains…",
    "Generating recommendations…",
  ];
  const handleFile = (f: File) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(f.type)) {
      setError("Please upload a PDF, DOC, DOCX, or TXT file.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB.");
      return;
    }
    setFile(f);
    setError(null);
    setAnalysis(null);
    setStep("upload");
  };
  const handleAnalyze = async () => {
    if (!file) return;
    setStep("analyzing");
    setError(null);
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % analyzingSteps.length;
      setAnalyzingStep(idx);
    }, 1100);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const { data } = await axiosInstance.post(
        "/api/resume/analyze",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setAnalysis(data.analysis);
      setStep("results");
    } catch (error: any) {
      setError(error?.response?.data?.message);
      setStep("upload");
    } finally {
      clearInterval(interval);
    }
  };
  const reset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
    setStep("upload");
  };
  const levelColor = (l: string) =>
    l === "Senior"
      ? "text-purple-500"
      : l === "Mid"
        ? "text-blue-500"
        : "text-green-500";

  return (
    <Card className="border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center text-lg">
            📄
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              AI Resume Analysis
            </p>
            <p className="text-xs text-muted-foreground">
              Upload your resume · Get domain recommendations
            </p>
          </div>
        </div>
        {step === "results" && (
          <button
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground border border-border/60 px-3 py-1 rounded-full transition-colors whitespace-nowrap"
          >
            Upload new ↑
          </button>
        )}
      </div>

      <div className="p-5">
        {/* Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                dragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : file
                    ? "border-primary/40 bg-primary/[0.03]"
                    : "border-border/50 hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">
                    📋
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(file.size / 1024).toFixed(0)} KB ·{" "}
                      {file.type.includes("pdf") ? "PDF" : "Document"}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                    className="ml-1 w-7 h-7 rounded-full bg-muted hover:bg-muted/60 flex items-center justify-center text-xs text-muted-foreground flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-4xl mb-3 flex justify-center text-primary"><CloudUpload className="w-10 h-10" /></div>
                  <p className="text-sm font-semibold text-foreground">
                    Drop your resume here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse · PDF, DOC, DOCX, TXT · Max 5 MB
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2.5 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> {error}
              </p>
            )}

            {!file && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    icon: <Search className="w-4 h-4 text-primary" />,
                    label: "Skills Detection",
                    desc: "Frameworks, languages, tools",
                  },
                  {
                    icon: <BarChart className="w-4 h-4 text-primary" />,
                    label: "Experience Level",
                    desc: "Junior / Mid / Senior",
                  },
                  {
                    icon: <Target className="w-4 h-4 text-primary" />,
                    label: "Domain Matching",
                    desc: "Best-fit interview areas",
                  },
                  {
                    icon: <Zap className="w-4 h-4 text-primary" />,
                    label: "Strength Analysis",
                    desc: "Your competitive edge",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border/40"
                  >
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={!file}
              className="w-full rounded-xl bg-primary hover:opacity-90 text-white font-semibold py-5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2"><BrainCircuit className="w-4 h-4" /> Analyse Resume with AI</span>
            </Button>
          </div>
        )}

        {/* Analyzing */}
        {step === "analyzing" && (
          <div className="py-10 flex flex-col items-center gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="w-16 h-16 flex items-center justify-center mx-auto text-primary">
                <FileText className="w-8 h-8" />
              </div>
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-sm font-bold text-foreground">
                Groq AI is reading your resume…
              </p>
              <p className="text-xs text-muted-foreground transition-all duration-300">
                {analyzingSteps[analyzingStep]}
              </p>
            </div>
            <div className="w-64 bg-border/50 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "70%" }} />
            </div>
          </div>
        )}

        {step === "results" && analysis && (
          <div className="space-y-5">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold text-foreground">AI Summary</p>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
                  {analysis.experienceLevel} Level
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{analysis.summary}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-primary" /> Skills Detected</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.skillsDetected.map((skill: string) => (
                  <span key={skill} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-foreground mb-2.5 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-primary" /> Recommended Interview Domains</p>
              <div className="space-y-2">
                {analysis.recommendedDomains.map((rec: any, i: number) => {
                  const meta = INTERVIEW_DOMAINS.find((d) => d.label === rec.label);
                  return (
                    <button
                      key={rec.label}
                      onClick={() => onDomainSelect(rec.label)}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border/60 hover:border-primary hover:bg-primary/5 transition-all group text-left"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center text-primary group-hover:border-primary/30 transition-colors">
                        {meta?.icon || <Target className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {i === 0 && <span className="text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-full whitespace-nowrap">TOP PICK</span>}
                          <p className="text-sm font-semibold text-foreground truncate">{rec.label}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{rec.reason}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <p className="text-xs font-bold text-primary">{rec.confidence}%</p>
                        <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${rec.confidence}%` }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {analysis.strengths.length > 0 && (
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-2.5 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Your Strengths
                </p>
                <ul className="space-y-1.5">
                  {analysis.strengths.map((s: string) => (
                    <li key={s} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.areasForImprovement && analysis.areasForImprovement.length > 0 && (
              <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2.5 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Areas for Improvement
                </p>
                <ul className="space-y-1.5">
                  {analysis.areasForImprovement.map((s: string) => (
                    <li key={s} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

const DashboardPage = () => {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const [interviews, setIntervies] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [ShowDomainSelector, setShowDomainSelector] = useState(false);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"analytics" | "history" | "resume">("analytics");
  
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [interviewDetails, setInterviewDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showDeleteModalId, setShowDeleteModalId] = useState<string | null>(null);
  const [deleteActionLoading, setDeleteActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (isLoggedIn) fetchInterviews();
  }, [isLoggedIn]);

  const fetchInterviews = async () => {
    try {
      setDataLoading(true);
      const { data } = await axiosInstance.get("/api/interviews");
      const fetched = data.interviews || [];
      // Sort chronologically for chart
      const sorted = [...fetched].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setIntervies(sorted);
    } catch (error) { console.error(error); } finally { setDataLoading(false); }
  };

  const handleSelectDomain = (domain: string) => router.push(`/interview?domain=${encodeURIComponent(domain)}`);

  const handleViewDetails = async (id: string) => {
    setSelectedInterviewId(id);
    setDetailsLoading(true);
    setInterviewDetails(null);
    try {
      const { data } = await axiosInstance.get(`/api/interviews/${id}`);
      setInterviewDetails(data.interview);
    } catch (error) { console.error(error); } finally { setDetailsLoading(false); }
  };

  const handleClearHistory = async () => {
    setDeleteActionLoading(true);
    try {
      await axiosInstance.delete("/api/interviews");
      setIntervies([]);
      setShowClearHistoryModal(false);
    } catch (error) { console.error(error); } finally { setDeleteActionLoading(false); }
  };

  const handleDeleteIndividual = async (id: string) => {
    setDeleteActionLoading(true);
    try {
      await axiosInstance.delete(`/api/interviews/${id}`);
      setIntervies(interviews.filter(i => i.id !== id));
      setShowDeleteModalId(null);
    } catch (error) { console.error(error); } finally { setDeleteActionLoading(false); }
  };

  if (authLoading) return <div className="min-h-[100dvh] bg-background flex items-center justify-center">Loading…</div>;
  if (!isLoggedIn) return null;

  const avgScore = interviews.length ? Math.round(interviews.reduce((s, i) => s + i.score, 0) / interviews.length) : 0;
  const filtered = filterDomain === "All" ? interviews : interviews.filter((i) => i.topic === filterDomain);

  // Compute Data for Line Chart (Progress over time)
  const lineChartData = interviews.map((i, index) => ({
    name: `Session ${index + 1}`,
    score: i.score,
    domain: i.topic,
    date: new Date(i.date).toLocaleDateString()
  }));

  // Compute Data for Radar Chart (Domain Proficiency)
  const domainStats = interviews.reduce((acc, curr) => {
    if (!acc[curr.topic]) acc[curr.topic] = { totalScore: 0, count: 0 };
    acc[curr.topic].totalScore += curr.score;
    acc[curr.topic].count += 1;
    return acc;
  }, {} as Record<string, { totalScore: number, count: number }>);
  
  const radarChartData = Object.entries(domainStats).map(([domain, stats]: [string, any]) => ({
    subject: domain,
    A: Math.round(stats.totalScore / stats.count),
    fullMark: 100,
  }));

  // AI Suggestions computation
  const lowestDomain = radarChartData.length > 0 ? radarChartData.reduce((prev, current) => (prev.A < current.A) ? prev : current).subject : null;
  const highestDomain = radarChartData.length > 0 ? radarChartData.reduce((prev, current) => (prev.A > current.A) ? prev : current).subject : null;

  return (
    <div className="flex-1 bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">Welcome back, {user?.name?.split(" ")[0]}</p>
            <h1 className="text-3xl font-black">Your Dashboard</h1>
          </div>
          <Button onClick={() => handleSelectDomain("General")} className="shadow-md">⚡ New Interview</Button>
        </section>

        {interviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 border-border/60">
              <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2"><Target className="w-4 h-4"/> Total Sessions</p>
              <h3 className="text-3xl font-black">{interviews.length}</h3>
            </Card>
            <Card className="p-5 border-border/60">
              <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2"><Activity className="w-4 h-4"/> Average Score</p>
              <h3 className="text-3xl font-black text-primary">{avgScore}%</h3>
            </Card>
            <Card className="p-5 border-border/60">
              <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> Best Score</p>
              <h3 className="text-3xl font-black text-green-500">{Math.max(...interviews.map(i => i.score), 0)}%</h3>
            </Card>
            <Card className="p-5 border-border/60">
              <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-accent"/> Strongest Area</p>
              <h3 className="text-xl font-bold text-accent truncate pt-1">{highestDomain || "-"}</h3>
            </Card>
          </div>
        )}

        <section>
          <div className="flex border-b border-border/50 mb-6">
            {(["analytics", "history", "resume"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px capitalize transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {tab === "history" ? <span className="flex items-center gap-1.5"><FileText className="w-4 h-4"/> History</span> : tab === "resume" ? <span className="flex items-center gap-1.5"><FileText className="w-4 h-4"/> Resume</span> : <span className="flex items-center gap-1.5"><BarChart className="w-4 h-4"/> Analytics</span>}
              </button>
            ))}
          </div>

          {activeTab === "analytics" && (
            <div className="space-y-6">
              {interviews.length === 0 ? (
                 <div className="p-12 text-center border-2 border-dashed border-border rounded-xl">
                   <BarChart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                   <h3 className="font-bold mb-2">No analytics available yet</h3>
                   <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">Complete at least one mock interview to unlock detailed performance graphs and AI suggestions.</p>
                   <Button onClick={() => router.push("/practice")}>Start Practicing</Button>
                 </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="p-6 border-border/60 flex flex-col">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" /> Performance Trend
                      </h3>
                      <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                          <LineChart data={lineChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} activeDot={{ r: 8 }} />
                            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" opacity={0.2} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                              itemStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card className="p-6 border-border/60 flex flex-col">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-accent" /> Domain Proficiency
                      </h3>
                      <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Score" dataKey="A" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.4} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                              itemStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-6 border-primary/20 bg-primary/[0.02]">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" /> AI Actionable Suggestions
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {lowestDomain ? (
                        <div className="flex items-start gap-3 p-4 bg-background rounded-xl border border-border/50 shadow-sm">
                          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-sm">Focus on {lowestDomain}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Your average score in {lowestDomain} is lower compared to your overall average. We recommend doing 2-3 focused mock sessions on {lowestDomain} to bridge the knowledge gap.</p>
                          </div>
                        </div>
                      ) : null}
                      <div className="flex items-start gap-3 p-4 bg-background rounded-xl border border-border/50 shadow-sm">
                        <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">Review Time Management</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Try to keep your answers concise. Structured communication using the STAR method (Situation, Task, Action, Result) will naturally boost your AI evaluation scores.</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div>
              {filtered.length === 0 && interviews.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-border rounded-xl">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-bold">No sessions yet</h3>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <Button variant="outline" size="sm" onClick={() => setShowClearHistoryModal(true)} className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50">
                      <Trash2 className="w-4 h-4 mr-2" /> Clear All History
                    </Button>
                  </div>
                  {filtered.slice().reverse().map((interview) => (
                    <Card key={interview.id} className="p-4 sm:p-5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border/60 hover:border-primary/30 bg-card hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-xl text-primary group-hover:bg-primary/20 transition-colors flex-shrink-0">
                          <Target className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                             <p className="font-bold text-base truncate">{interview.topic}</p>
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${interview.score >= 80 ? 'bg-green-500/10 text-green-600' : interview.score >= 60 ? 'bg-blue-500/10 text-blue-600' : 'bg-orange-500/10 text-orange-600'}`}>{interview.score}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                             <span className="flex items-center gap-1"><FileText className="w-3 h-3"/> {new Date(interview.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                             <span className="hidden sm:inline">•</span>
                             <span className="flex items-center gap-1"><Activity className="w-3 h-3"/> {Math.floor(interview.duration / 60)} min</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(interview.id)} className="rounded-full flex-1 sm:flex-none group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">View Details</Button>
                        <Button variant="ghost" size="icon" onClick={() => setShowDeleteModalId(interview.id)} className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}
          {activeTab === "resume" && <ResumePanel onDomainSelect={handleSelectDomain} />}
        </section>
      </div>

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
              <Card data-lenis-prevent className="w-full max-h-[85vh] overflow-y-auto scrollbar-thin p-6 border border-border shadow-2xl flex flex-col">
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-border/50">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground mb-1">
                        Interview Details
                      </h2>
                      {interviewDetails && (
                        <p className="text-sm text-muted-foreground">
                          {interviewDetails.topic} • Score: {interviewDetails.score}%
                        </p>
                      )}
                    </div>
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
                    {/* AI Feedback Summary */}
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

                    {/* Conversation History */}
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
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted border border-border/50 text-foreground"
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
      <Modal
        isOpen={showClearHistoryModal}
        onClose={() => setShowClearHistoryModal(false)}
        title="Clear All History?"
        description="Are you sure you want to permanently delete all your interview history? This action cannot be undone."
      >
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setShowClearHistoryModal(false)} className="rounded-full">Cancel</Button>
          <Button variant="destructive" onClick={handleClearHistory} disabled={deleteActionLoading} className="rounded-full">
            {deleteActionLoading ? "Deleting..." : "Clear All"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!showDeleteModalId}
        onClose={() => setShowDeleteModalId(null)}
        title="Delete Interview?"
        description="Are you sure you want to permanently delete this interview? This action cannot be undone."
      >
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setShowDeleteModalId(null)} className="rounded-full">Cancel</Button>
          <Button variant="destructive" onClick={() => showDeleteModalId && handleDeleteIndividual(showDeleteModalId)} disabled={deleteActionLoading} className="rounded-full">
            {deleteActionLoading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>

    </div>
  );
};


export default DashboardPage;
