import { useState } from "react";
import { Info, ChevronDown, ChevronUp, Camera, ScanBarcode, ImagePlus, Video, CheckCircle2, MessageSquare } from "lucide-react";

export function HowToUseGuide() {
  const [open, setOpen] = useState(false);

  const steps = [
    { icon: Camera, title: "📸 Scan with Camera", desc: "Open camera and capture a photo of the waste item for AI identification." },
    { icon: ImagePlus, title: "🖼️ Upload Photo", desc: "Upload a saved photo from your gallery instead of using the camera." },
    { icon: ScanBarcode, title: "🔍 Scan Barcode", desc: "Scan the barcode on packaging to identify the product and its waste category." },
    { icon: Video, title: "🎥 Record Video", desc: "Record a short video for better AI analysis of complex items." },
    { icon: CheckCircle2, title: "✅ Verify Placement", desc: "Take a photo of the item in the correct colored bin to earn points." },
    { icon: MessageSquare, title: "💬 Give Feedback", desc: "If the AI made a mistake, submit a correction with the actual item name to help improve accuracy." },
  ];

  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          <span className="font-display font-semibold text-sm">How to Use EcoSort</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 animate-scale-in">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3">
            <p className="text-xs text-muted-foreground">
              EcoSort uses AI to identify waste items and tells you which colored bin to use. 
              You earn points for correctly disposing items!
            </p>
          </div>

          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <step.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}

          <div className="bg-accent/10 border border-accent/20 rounded-2xl p-3">
            <p className="text-xs font-semibold text-accent-foreground mb-1">🎯 Bin Colors Guide</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { color: "Blue", hex: "#3b82f6", items: "Plastic, Paper" },
                { color: "Green", hex: "#22c55e", items: "Wet waste, Glass" },
                { color: "Yellow", hex: "#eab308", items: "Metal" },
                { color: "Red", hex: "#ef4444", items: "E-waste" },
              ].map((bin) => (
                <div key={bin.color} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: bin.hex }} />
                  <span><strong>{bin.color}:</strong> {bin.items}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
