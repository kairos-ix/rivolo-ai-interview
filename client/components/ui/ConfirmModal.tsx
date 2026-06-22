import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";
import { Card } from "./card";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isDanger?: boolean;
  children?: React.ReactNode;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  isDanger = false,
  children,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoading) onCancel();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-sm"
          >
            <Card className={`w-full p-6 border shadow-2xl ${isDanger ? 'border-destructive/30' : 'border-border/50'}`}>
              <h3 className={`text-lg font-bold mb-1 ${isDanger ? 'text-destructive' : 'text-foreground'}`}>
                {title}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {description}
              </p>
              
              {children && <div className="mb-6">{children}</div>}

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="rounded-full border-border/60"
                >
                  {cancelText}
                </Button>
                <Button
                  variant={isDanger ? "destructive" : "default"}
                  disabled={isLoading}
                  onClick={onConfirm}
                  className="rounded-full font-semibold"
                >
                  {isLoading ? "Processing..." : confirmText}
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
