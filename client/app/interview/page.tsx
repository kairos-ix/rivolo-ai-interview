"use client";
import InterviewContent from "@/components/InterviewContent";
import React, { Suspense } from "react";

function InterviewSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Starting interview…</p>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<InterviewSkeleton />}>
      <InterviewContent />
    </Suspense>
  );
}
