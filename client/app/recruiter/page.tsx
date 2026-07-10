"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Building2 } from "lucide-react";
import axiosInstance from "@/lib/axios";

const COMPANY_LIST = [
  { id: "google", name: "Google", type: "product", tier: "FAANG", logo: "🔵", difficulty: "hard", style: "Highly structured. Focuses on algorithmic thinking, data structures, system design at scale.", focusAreas: ["Algorithms", "System Design", "Coding", "Behavioral"] },
  { id: "amazon", name: "Amazon", type: "product", tier: "FAANG", logo: "🟠", difficulty: "hard", style: "Leadership Principles driven. Expect STAR behavioral rounds alongside DSA and system design.", focusAreas: ["Leadership Principles", "DSA", "System Design", "Behavioral"] },
  { id: "meta", name: "Meta", type: "product", tier: "FAANG", logo: "🔵", difficulty: "hard", style: "Speed + correctness. Expects optimal DSA solutions fast. Strong system design at senior levels.", focusAreas: ["DSA", "System Design", "Behavioral", "Product Sense"] },
  { id: "microsoft", name: "Microsoft", type: "product", tier: "FAANG", logo: "🔷", difficulty: "medium", style: "Collaborative and growth-mindset focused. Mix of DSA, system design, and cultural fit.", focusAreas: ["DSA", "OOP", "System Design", "Behavioral"] },
  { id: "startup", name: "Startup (Generic)", type: "startup", tier: "startup", logo: "🚀", difficulty: "medium", style: "Fast-paced, practical. No time for theory — show what you've built. Interviewers want problem-solvers.", focusAreas: ["Projects", "Practical Coding", "Architecture", "Mindset"] },
  { id: "tcs", name: "TCS", type: "service", tier: "mass-recruiter", logo: "🔵", difficulty: "easy", style: "Volume hiring. Aptitude-heavy first rounds, followed by basic programming and communication.", focusAreas: ["Aptitude", "Core CS", "Communication", "HR"] },
  { id: "infosys", name: "Infosys", type: "service", tier: "mass-recruiter", logo: "🟢", difficulty: "easy", style: "Hackwithinfy for top performers, else standard aptitude + pseudocode + HR.", focusAreas: ["Aptitude", "Pseudocode", "Verbal", "HR"] },
  { id: "wipro", name: "Wipro", type: "service", tier: "mass-recruiter", logo: "🟡", difficulty: "easy", style: "Aptitude, coding, and communication. NLTH for filtering, followed by technical and HR.", focusAreas: ["Aptitude", "Coding", "Core CS", "HR"] },
  { id: "anthropic", name: "Anthropic", type: "ai-safety", tier: "frontier-ai", logo: "🔶", difficulty: "hard", style: "Mission-critical AI safety company. Every interview stage evaluates two things equally: technical depth AND values alignment.", focusAreas: ["AI Safety & Values", "LLM System Design", "Python Coding", "Constitutional AI"] },
  { id: "openai", name: "OpenAI", type: "ai-research", tier: "frontier-ai", logo: "⚫", difficulty: "hard", style: "AGI-focused company moving fast with high technical and mission bars. Process is intentionally decentralized.", focusAreas: ["Practical Engineering", "LLM System Design", "Mission Alignment", "AI Ethics"] },
  { id: "deepmind", name: "Google DeepMind", type: "ai-research", tier: "frontier-ai", logo: "🧠", difficulty: "hard", style: "Academic rigor meets real-world AI impact. Research-first organization — they hire scientists who ship.", focusAreas: ["ML Research", "Paper Analysis", "Coding", "System Design for ML"] },
  { id: "tesla", name: "Tesla", type: "ev-tech", tier: "mission-driven", logo: "⚡", difficulty: "hard", style: "Fast-paced, mission-driven engineering culture obsessed with first-principles thinking and execution speed.", focusAreas: ["DSA", "EV System Design", "Real-time Systems", "Mission Alignment"] },
  { id: "spacex", name: "SpaceX", type: "aerospace", tier: "mission-driven", logo: "🚀", difficulty: "hard", style: "One of the most demanding technical interview processes anywhere. SpaceX interviewers ask problems that test whether you can reason from first principles.", focusAreas: ["First-Principles Engineering", "Aerospace System Design", "Low-Level Systems", "Ownership Behavioral"] },
  { id: "jpmorgan", name: "JP Morgan", type: "finance", tier: "top-bank", logo: "🏦", difficulty: "medium", style: "One of the world's largest investment banks. Interview style blends finance domain knowledge with solid software engineering.", focusAreas: ["Finance Knowledge", "SQL & Data Modeling", "System Design", "Behavioral STAR"] },
  { id: "goldman", name: "Goldman Sachs", type: "finance", tier: "top-bank", logo: "🏛️", difficulty: "hard", style: "Elite investment bank with a rigorous multi-stage process culminating in the famous 'Superday'. Bar is extremely high.", focusAreas: ["DSA", "Financial System Design", "Low-Level Design + SQL", "Financial Engineering"] },
  { id: "apple", name: "Apple", type: "product", tier: "FAANG", logo: "🍎", difficulty: "medium", style: "Craft-obsessed company that values code quality, user empathy, and privacy-by-design above almost everything else.", focusAreas: ["DSA (Correctness-First)", "Privacy System Design", "OOP & API Design", "Craftsmanship Behavioral"] },
  { id: "netflix", name: "Netflix", type: "product", tier: "FAANG", logo: "🔴", difficulty: "hard", style: "High-performance culture defined by 'freedom and responsibility'. System design interviews go far beyond typical FAANG.", focusAreas: ["Streaming System Design", "ML Infrastructure", "Performance Coding", "Culture Fit"] },
  { id: "uber", name: "Uber", type: "product", tier: "top-tech", logo: "⚫", difficulty: "medium", style: "Marketplace and real-time systems company operating at global scale. Interviews focus heavily on distributed systems.", focusAreas: ["Real-time System Design", "Distributed Systems", "Practical DSA", "Marketplace Engineering"] },
  { id: "nvidia", name: "Nvidia", type: "ai-infrastructure", tier: "top-tech", logo: "🟢", difficulty: "hard", style: "The company that powers AI. Emphasizes GPU architecture knowledge, CUDA programming, and ML infrastructure.", focusAreas: ["GPU Architecture", "ML Infrastructure", "Inference Optimization", "Systems Performance"] },
  { id: "xai", name: "xAI", type: "ai-research", tier: "frontier-ai", logo: "✖️", difficulty: "hard", style: "Elon Musk's AI company building Grok. Small, elite team moving extremely fast. Conducts in-person onsites.", focusAreas: ["Frontier ML Systems", "Transformer Architecture", "RLHF & Training", "First-Principles AI"] }
];

const CANDIDATE_TYPES = [
  { value: "fresher", label: "Fresher" },
  { value: "internship", label: "Internship Seeker" },
  { value: "experienced", label: "Experienced" },
];

const RecruiterSelectionPage = () => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [candidateType, setCandidateType] = useState("fresher");
  const [loadingCompany, setLoadingCompany] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  const handleStart = async (companyId: string) => {
    try {
      setLoadingCompany(companyId);
      const res = await axiosInstance.post("/api/recruiter/start", {
        companyId,
        candidateType
      });
      router.push(`/recruiter/interview/${res.data.sessionId}`);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to start session.");
      setLoadingCompany(null);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "medium": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "hard": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getTypeBadge = (type: string, tier: string) => {
    return (
      <>
        {tier === "FAANG" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">FAANG</span>}
        {tier === "frontier-ai" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 border border-violet-500/20">Frontier AI</span>}
        {tier === "top-bank" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">Top Bank</span>}
        {tier === "mission-driven" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 border border-orange-500/20">Mission-Driven</span>}
        {tier === "top-tech" && <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-500/10 text-slate-600 border border-slate-500/20">Top Tech</span>}
        
        {type === "startup" && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Startup</span>}
        {type === "service" && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-500/10 text-slate-600 border border-slate-500/20">Service</span>}
        {type === "ai-safety" && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 border border-purple-500/20">AI Safety</span>}
        {type === "ai-research" && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">AI Research</span>}
        {type === "ev-tech" && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-500/20">EV Tech</span>}
        {type === "aerospace" && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 border border-sky-500/20">Aerospace</span>}
        {type === "finance" && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">Finance</span>}
        {type === "ai-infrastructure" && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-500/10 text-green-600 border border-green-500/20">AI Infra</span>}
        {type === "product" && <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20">Product</span>}
      </>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
          >
            <Building2 className="w-10 h-10 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-3">AI Recruiter Simulator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience real company interview styles. Choose your target company and get evaluated against their specific hiring standards.
            </p>
          </div>

          <div className="inline-flex flex-wrap justify-center gap-2 bg-muted/50 rounded-full p-1 border border-border/50">
            {CANDIDATE_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setCandidateType(t.value)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                  candidateType === t.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Company Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {COMPANY_LIST.map((company) => (
            <motion.div key={company.id} variants={itemVariants}>
              <Card className="h-full flex flex-col p-6 border border-border/50 hover:border-primary/30 transition-colors shadow-sm hover:shadow-md bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" aria-hidden="true">{company.logo}</span>
                    <h3 className="font-bold text-lg text-foreground">{company.name}</h3>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  {getTypeBadge(company.type, company.tier)}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${getDifficultyColor(company.difficulty)}`}>
                    {company.difficulty.charAt(0).toUpperCase() + company.difficulty.slice(1)}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                  {company.style}
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex flex-wrap gap-1.5">
                    {company.focusAreas.slice(0, 4).map((area, i) => (
                      <span key={i} className="text-[10px] uppercase tracking-wider font-semibold bg-muted text-muted-foreground px-2 py-1 rounded">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => handleStart(company.id)}
                  disabled={!!loadingCompany}
                  className="w-full mt-auto rounded-xl font-semibold"
                  variant="default"
                >
                  {loadingCompany === company.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {loadingCompany === company.id ? "Preparing..." : "Start Interview"}
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
};

export default RecruiterSelectionPage;
