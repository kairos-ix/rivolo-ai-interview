"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, CheckCircle2, XCircle } from "lucide-react";

export default function RecruiterHistoryPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    fetchHistory();
  }, [isLoggedIn, router]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/recruiter/history");
      setHistory(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Simulation History</h1>
            <p className="text-muted-foreground">Review your past company-specific interview performances.</p>
          </div>
          <Button onClick={() => router.push("/recruiter")} variant="outline">
            New Simulation
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <Card className="p-12 text-center border-border/50 bg-muted/20">
            <h3 className="text-xl font-bold text-foreground mb-2">No Simulations Yet</h3>
            <p className="text-muted-foreground mb-6">You haven't completed any AI Recruiter simulations.</p>
            <Button onClick={() => router.push("/recruiter")}>Start Your First Simulation</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((session) => (
              <Card key={session._id} className="p-6 border-border/50 hover:border-primary/30 transition-colors shadow-sm bg-card flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{session.companyName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-foreground">{session.finalScore}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Score</span>
                  </div>
                </div>

                <div className="mt-2 mb-6">
                  {session.meetsCompanyBar ? (
                    <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-600 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-600 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold">
                      <XCircle className="w-3.5 h-3.5" /> Not Selected
                    </div>
                  )}
                </div>

                <Button 
                  variant="secondary" 
                  className="w-full mt-auto flex items-center justify-center gap-2"
                  onClick={() => router.push(`/recruiter/interview/${session._id}`)}
                >
                  View Report <ArrowRight className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
