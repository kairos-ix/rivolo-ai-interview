"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";

interface InputBoxProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function InputBox({ onSend, disabled }: InputBoxProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-background border-t border-border/50 p-3 sm:p-4 shrink-0">
      <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-muted/40 border border-border/60 rounded-2xl p-2 transition-colors focus-within:bg-background focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type your answer... (Shift+Enter for new line)"
          className="flex-1 max-h-[150px] min-h-[44px] resize-none bg-transparent py-3 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 scrollbar-thin"
          rows={1}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="h-11 w-11 shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-sm transition-all"
        >
          <SendHorizontal className="w-5 h-5" />
        </Button>
      </div>
      <div className="max-w-4xl mx-auto text-center mt-2">
        <p className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
          Tip: Be specific and use examples from your experience
        </p>
      </div>
    </div>
  );
}
