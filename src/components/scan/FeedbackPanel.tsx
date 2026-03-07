import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { ScanResult } from "./ScanFlow";

const CATEGORIES = ["Paper", "Wet", "Plastic", "Glass", "Metal", "E-waste"];

interface FeedbackPanelProps {
  result: ScanResult;
  scanId?: string;
  userId: string;
  showFeedback: boolean;
  onToggle: () => void;
  /** If true, shows expanded correction form by default (e.g. for barcode misidentification) */
  showCorrectionByDefault?: boolean;
}

export function FeedbackPanel({ result, scanId, userId, showFeedback, onToggle, showCorrectionByDefault }: FeedbackPanelProps) {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [correctedCategory, setCorrectedCategory] = useState<string | null>(
    showCorrectionByDefault ? "" : null
  );
  const [correctedMaterial, setCorrectedMaterial] = useState("");
  const [actualItemName, setActualItemName] = useState("");
  const [userName, setUserName] = useState("");
  const [notes, setNotes] = useState("");

  const submitFeedback = async (type: "confirmed" | "corrected") => {
    if (type === "corrected" && !actualItemName.trim()) {
      toast.error("Please enter the actual item name.");
      return;
    }
    if (type === "corrected" && !userName.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    try {
      await supabase.from("scan_feedback").insert({
        scan_id: scanId || "00000000-0000-0000-0000-000000000000",
        user_id: userId,
        original_category: result.category,
        corrected_category: type === "corrected" && correctedCategory ? correctedCategory : null,
        original_material: result.material || null,
        corrected_material: type === "corrected" && correctedMaterial ? correctedMaterial : null,
        feedback_type: type,
        notes: type === "corrected"
          ? `Reporter: ${userName.trim()} | Actual item: ${actualItemName.trim()}${notes ? ` | Notes: ${notes}` : ""}`
          : notes || null,
      });
      setFeedbackSent(true);
      toast.success(
        type === "confirmed"
          ? "Thanks for confirming!"
          : "Correction saved — this helps our AI improve! 🙏"
      );
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
        {showCorrectionByDefault ? (
          <>
            <AlertCircle className="w-4 h-4 text-destructive" />
            Wrong result? Report it here
          </>
        ) : (
          <>Was this classification correct?</>
        )}
        {showFeedback ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showFeedback && (
        <div className="glass-card rounded-2xl p-4 space-y-3 text-left animate-scale-in">
          {!showCorrectionByDefault && (
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
                onClick={() => setCorrectedCategory(correctedCategory ? null : "")}
              >
                <ThumbsDown className="w-4 h-4" /> Wrong
              </Button>
            </div>
          )}

          {(correctedCategory !== null || showCorrectionByDefault) && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Your Name *</Label>
                <Input
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="rounded-xl text-sm"
                  maxLength={100}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">What is the actual item? *</Label>
                <Input
                  placeholder="e.g. Holi color box, shampoo bottle..."
                  value={actualItemName}
                  onChange={(e) => setActualItemName(e.target.value)}
                  className="rounded-xl text-sm"
                  maxLength={200}
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">Correct category</p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
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
              </div>

              <Input
                placeholder="Correct material (optional)"
                value={correctedMaterial}
                onChange={(e) => setCorrectedMaterial(e.target.value)}
                className="rounded-xl text-sm"
                maxLength={100}
              />

              <textarea
                placeholder="Additional notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
                rows={2}
                maxLength={500}
              />

              <Button
                size="sm"
                className="w-full rounded-xl eco-gradient text-primary-foreground gap-1"
                onClick={() => submitFeedback("corrected")}
                disabled={!actualItemName.trim() || !userName.trim()}
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
