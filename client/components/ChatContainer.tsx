"use client";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  difficulty?: string;
}
interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
}
const ChatContainer = ({ messages, isLoading }: ChatContainerProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50 shadow-inner scrollbar-thin">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full text-muted-foreground pt-10">
            <p>Start an interview to begin</p>
          </div>
        )}
        {messages.map((message, idx) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: idx === messages.length - 1 ? 0.05 : 0, ease: "easeOut" }}
            className={`flex items-end gap-3 ${message.isUser ? "justify-end" : "justify-start"}`}
          >
            {!message.isUser && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`flex flex-col ${message.isUser ? "items-end" : "items-start"}`}>
              {!message.isUser && message.difficulty && (
                <div className="mb-1 ml-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    message.difficulty === "easy" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                    message.difficulty === "medium" ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                    "bg-red-500/10 text-red-600 border-red-500/20"
                  }`}>
                    {message.difficulty.toUpperCase()}
                  </span>
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-2xl px-5 py-3.5 rounded-3xl text-sm leading-relaxed shadow-sm ${
                  message.isUser
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : `bg-card border border-border/50 text-foreground rounded-bl-sm ${
                        message.difficulty === "easy" ? "border-l-2 border-l-green-500" :
                        message.difficulty === "medium" ? "border-l-2 border-l-orange-500" :
                        message.difficulty === "hard" ? "border-l-2 border-l-red-500" : ""
                      }`
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-border/50 text-foreground px-5 py-4 rounded-3xl rounded-bl-sm shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;
