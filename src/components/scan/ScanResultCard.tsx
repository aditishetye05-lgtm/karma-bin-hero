import { Sparkles, Camera, ShieldCheck, Recycle, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScanResult } from "./ScanFlow";

interface ScanResultCardProps {
  result: ScanResult;
  categoryPoints: Record<string, number>;
  binColors: Record<string, { color: string; hex: string }>;
  onVerify: () => void;
}

export function ScanResultCard({ result, categoryPoints, binColors, onVerify }: ScanResultCardProps) {
  const confidence = result.confidence ? Math.round(result.confidence * 100) : null;
  const bin = binColors[result.category] || { color: "Blue", hex: "#3b82f6" };

  return (
    <div className="glass-card rounded-3xl p-6 space-y-4 animate-scale-in">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl eco-gradient flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7 text-primary-foreground" />
        </div>
        <h3 className="font-display font-bold text-xl">{result.item_name}</h3>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm">
          {result.category} • +{categoryPoints[result.category] || 10} points
        </div>
      </div>

      {/* Structured details */}
      <div className="grid grid-cols-2 gap-2">
        {result.item_type && (
          <div className="bg-muted rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Item Type</p>
            <p className="text-sm font-semibold">{result.item_type}</p>
          </div>
        )}
        {result.material && (
          <div className="bg-muted rounded-xl p-3 text-center">
            <Beaker className="w-3.5 h-3.5 mx-auto mb-0.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-0.5">Material</p>
            <p className="text-sm font-semibold">{result.material}</p>
          </div>
        )}
        {result.recyclability && (
          <div className="bg-muted rounded-xl p-3 text-center">
            <Recycle className="w-3.5 h-3.5 mx-auto mb-0.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-0.5">Recyclability</p>
            <p className="text-sm font-semibold capitalize">{result.recyclability}</p>
          </div>
        )}
        {confidence !== null && (
          <div className="bg-muted rounded-xl p-3 text-center">
            <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-0.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-0.5">Confidence</p>
            <p className="text-sm font-semibold">{confidence}%</p>
          </div>
        )}
      </div>

      {/* Disposal recommendation */}
      {result.disposal_recommendation && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <p className="text-xs font-semibold text-primary mb-1">♻️ Disposal Recommendation</p>
          <p className="text-sm text-foreground">{result.disposal_recommendation}</p>
        </div>
      )}

      <div className="rounded-2xl p-4 text-center border-2" style={{ borderColor: bin.hex, backgroundColor: `${bin.hex}15` }}>
        <p className="text-sm text-muted-foreground">Place in the</p>
        <p className="font-display font-bold text-lg" style={{ color: bin.hex }}>{bin.color} Bin</p>
      </div>

      <Button
        onClick={onVerify}
        className="w-full rounded-2xl eco-gradient text-primary-foreground font-semibold py-5"
      >
        <Camera className="mr-2 w-5 h-5" /> Verify Placement
      </Button>
    </div>
  );
}
