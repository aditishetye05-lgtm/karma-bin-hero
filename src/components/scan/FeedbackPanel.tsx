import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Send } from "lucide-react";
import { toast } from "sonner";
import type { ScanResult } from "./ScanFlow";

const CATEGORIES = ["Paper", "Wet", "Plastic", "Glass", "Metal", "E-waste"];

interface FeedbackPanelProps {
  result: ScanResult;
  scanId: string;
  userId: string;
  showFeedback: boolean;
  onToggle: () => void;
}

export function FeedbackPanel({ result, scanId, userId, showFeedback, onToggle }: FeedbackPanelProps) {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [correctedCategory, setCorrectedCategory] = useState<string | null>(null);
  const [correctedMaterial, setCorrectedMaterial] = useState("");
  const [notes, setNotes] = useState("");

  const submitFeedback = async (type: "confirmed" | "corrected") => {
    try {
      await supabase.from("scan_feedback").insert({
        scan_id: scanId,
        user_id: userId,
        original_category: result.category,
        corrected_category: type === "corrected" ? correctedCategory : null,
        original_material: result.material || null,
        corrected_material: type === "corrected" && correctedMaterial ? correctedMaterial : null,
        feedback_type: type,
        notes: notes || null,
      });
      setFeedbackSent(true);
      toast.success(type === "confirmed" ? "Thanks for confirming!" : "Correction saved — helps us improve!");
    } catch {
      toast.error("Could not save feedback.");
    }
  };

  if (feedbackSent) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 text-center">
        <p className="text-sm text-primary font-semibold">✅ Feedback recorded — thank you!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="flex items-center justify-center gap-1 text-sm text-muted-foreground mx-auto hover:text-foreground transition-colors"
      >
        Was this classification correct?
        {showFeedback ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showFeedback && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-left animate-scale-in">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1 rounded-xl"
              onClick={() => submitFeedback("confirmed")}
            >
              <ThumbsUp className="w-4 h-4" /> Correct
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setCorrectedCategory(correctedCategory ? null : result.category)}
            >
              <ThumbsDown className="w-4 h-4" /> Wrong
            </Button>
          </div>

          {correctedCategory !== null && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">What's the correct category?</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.filter(c => c !== result.category).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCorrectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      correctedCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Correct material (optional)"
                value={correctedMaterial}
                onChange={(e) => setCorrectedMaterial(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Additional notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm resize-none"
                rows={2}
              />
              <Button
                size="sm"
                className="w-full rounded-xl eco-gradient text-primary-foreground gap-1"
                onClick={() => submitFeedback("corrected")}
                disabled={!correctedCategory || correctedCategory === result.category}
              >
                <Send className="w-4 h-4" /> Submit Correction
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
