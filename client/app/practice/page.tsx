"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Code, Atom, FileJson, BarChart, Settings, 
  Server, Database, Target, Shield, Lock, 
  Wifi, Eye, Lightbulb 
} from "lucide-react";

const INTERVIEW_DOMAINS = [
  {
    label: "JavaScript/Node.js",
    icon: <FileJson className="w-6 h-6 text-yellow-500" />,
    desc: "ES6+, async patterns, Node.js runtime, event loop",
    topics: ["Closures", "Promises", "Event Loop", "Modules"],
  },
  {
    label: "React",
    icon: <Atom className="w-6 h-6 text-blue-400" />,
    desc: "Hooks, component patterns, state management",
    topics: ["useState", "useEffect", "Context API", "Performance"],
  },
  {
    label: "Python",
    icon: <Code className="w-6 h-6 text-blue-500" />,
    desc: "OOP, data structures, standard library",
    topics: ["Decorators", "Generators", "List Comprehensions", "OOP"],
  },
  {
    label: "Data Science",
    icon: <BarChart className="w-6 h-6 text-green-500" />,
    desc: "Machine learning, pandas, statistics",
    topics: ["Regression", "Classification", "Feature Engineering", "EDA"],
  },
  {
    label: "DevOps",
    icon: <Settings className="w-6 h-6 text-gray-500" />,
    desc: "CI/CD pipelines, Docker, Kubernetes",
    topics: ["Containers", "Orchestration", "Monitoring", "IaC"],
  },
  {
    label: "System Design",
    icon: <Server className="w-6 h-6 text-indigo-500" />,
    desc: "Scalable architecture, distributed systems",
    topics: ["Load Balancing", "Caching", "Database Sharding", "CDN"],
  },
  {
    label: "Database Design",
    icon: <Database className="w-6 h-6 text-slate-600 dark:text-slate-400" />,
    desc: "SQL, NoSQL, indexing, normalization",
    topics: ["Normalization", "Indexing", "Transactions", "Replication"],
  },
  {
    label: "Cybersecurity",
    icon: <Shield className="w-6 h-6 text-red-500" />,
    desc: "Network security, cryptography, penetration testing",
    topics: ["Cryptography", "Network Security", "Pen Testing", "OWASP"],
  },
  {
    label: "Ethical Hacking",
    icon: <Lock className="w-6 h-6 text-orange-500" />,
    desc: "Vulnerability assessment, exploit development",
    topics: ["Exploitation", "Privilege Escalation", "Reconnaissance"],
  },
  {
    label: "Network Security",
    icon: <Wifi className="w-6 h-6 text-cyan-500" />,
    desc: "Firewalls, VPNs, intrusion detection",
    topics: ["Firewalls", "IDS/IPS", "VPNs", "Packet Analysis"],
  },
  {
    label: "General",
    icon: <Target className="w-6 h-6 text-primary" />,
    desc: "Behavioural questions & CS fundamentals",
    topics: ["Problem Solving", "Communication", "Teamwork", "Algorithms"],
  },
];

export default function PracticePage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  useEffect(() => {
    const savedDomain = sessionStorage.getItem("selectedDomain");
    if (savedDomain) setSelectedDomain(savedDomain);
  }, []);

  const handleSelectDomain = (domain: string) => {
    setSelectedDomain(domain);
    sessionStorage.setItem("selectedDomain", domain);
  };

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  const handleStart = (domain: string) => {
    router.push(`/interview?domain=${encodeURIComponent(domain)}`);
  };

  return (
    <div className="flex-1 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* Header */}
        <section>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">
            Practice Interview
          </h1>
          <p className="text-muted-foreground max-w-lg">
            Choose a domain to start a mock interview. Each session includes 3
            AI-generated questions tailored to the topic.
          </p>
        </section>

        {/* Domain Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTERVIEW_DOMAINS.map((domain, i) => (
            <motion.div
              key={domain.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card
                className={`group p-5 border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedDomain === domain.label
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50 hover:border-primary/40"
                }`}
                onClick={() => handleSelectDomain(domain.label)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center text-2xl flex-shrink-0 group-hover:border-primary/30 transition-colors">
                    {domain.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground mb-1">
                      {domain.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {domain.desc}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {domain.topics.map((topic) => (
                        <span
                          key={topic}
                          className="text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedDomain === domain.label && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 pt-4 border-t border-border/40"
                  >
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStart(domain.label);
                      }}
                      className="w-full rounded-xl bg-primary hover:opacity-90 text-white font-semibold"
                    >
                      Start {domain.label} Interview →
                    </Button>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Tips */}
        <Card className="p-5 border border-border/50 bg-muted/20">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            Interview Tips
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: "Be Specific",
                desc: "Use concrete examples from your experience to support your answers.",
              },
              {
                title: "Think Aloud",
                desc: "Walk through your thought process — the AI evaluates your approach, not just the answer.",
              },
              {
                title: "Ask Clarifications",
                desc: "If a question is unclear, asking follow-ups shows strong communication skills.",
              },
            ].map((tip) => (
              <div key={tip.title}>
                <p className="text-xs font-semibold text-foreground mb-1">
                  {tip.title}
                </p>
                <p className="text-xs text-muted-foreground">{tip.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
