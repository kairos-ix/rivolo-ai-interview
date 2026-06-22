"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function ServerWakeupManager() {
  const [showPopup, setShowPopup] = useState(false);
  const [isAwake, setIsAwake] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hasChecked) return;

    let timeoutId: NodeJS.Timeout;
    
    const pingServer = async () => {
      try {
        // Start a timer to show the popup if the server takes longer than 3 seconds
        timeoutId = setTimeout(() => {
          if (!isAwake) {
            setShowPopup(true);
          }
        }, 3000);

        // Ping the backend root URL to wake it up
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const rootUrl = apiUrl.replace("/api", "");
        
        await fetch(rootUrl);
        
        // If we get here, the server responded
        setIsAwake(true);
        
        // If the popup was showing, show the success state briefly before hiding
        if (showPopup) {
          setTimeout(() => setShowPopup(false), 3000);
        } else {
          // If it answered fast, clear the timeout so the popup never shows
          clearTimeout(timeoutId);
        }
      } catch (error) {
        // If fetch fails (e.g. CORS on root, though it should wake it up regardless)
        console.error("Wake ping failed", error);
        clearTimeout(timeoutId);
        setShowPopup(false);
      } finally {
        setHasChecked(true);
      }
    };

    pingServer();

    return () => clearTimeout(timeoutId);
  }, [hasChecked, isAwake, showPopup]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-background/95 backdrop-blur-md border border-border shadow-2xl p-4 rounded-2xl max-w-[350px]"
        >
          <div className={`p-2 rounded-full ${isAwake ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`}>
            {isAwake ? <CheckCircle2 className="w-6 h-6" /> : <Loader2 className="w-6 h-6 animate-spin" />}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">
              {isAwake ? "Server is Awake!" : "Waking up server..."}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {isAwake 
                ? "Systems are fully operational and ready." 
                : "Free hosting spins down when idle. This takes ~30s. Hang tight! 🚀"}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
