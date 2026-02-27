import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ConfettiOverlay } from "./ConfettiOverlay";

const CATEGORY_POINTS: Record<string, number> = {
  Plastic: 40, "E-waste": 50, Metal: 20, Glass: 20, Paper: 10, Wet: 5,
};

const BIN_COLORS: Record<string, string> = {
  Plastic: "Blue", Paper: "Blue", Glass: "Blue", Metal: "Blue", "E-waste": "Blue", Wet: "Green",
};

type ScanStep = "capture" | "analyzing" | "result" | "cleaning" | "verify" | "verifying" | "done";

interface ScanResult {
  category: string;
  item_name: string;
  needs_cleaning: boolean;
  cleaning_instructions?: string;
}

export function ScanFlow() {
  const { user } = useAuth();
  const { refetch } = useProfile();
  const [step, setStep] = useState<ScanStep>("capture");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      toast.error("Could not access camera. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    stopCamera();
    return dataUrl;
  }, [stopCamera]);

  const analyzeImage = async (imageData: string) => {
    setStep("analyzing");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-waste", {
        body: { image: imageData },
      });
      if (error) throw error;
      setResult(data as ScanResult);
      setStep(data.needs_cleaning ? "cleaning" : "result");
    } catch (e) {
      toast.error("Analysis failed. Please try again.");
      setStep("capture");
    }
  };

  const handleCapture = async () => {
    const image = capturePhoto();
    if (!image) return;
    setCapturedImage(image);
    await analyzeImage(image);
  };

  const handleVerifyCapture = async () => {
    const image = capturePhoto();
    if (!image || !result || !user) return;
    setStep("verifying");
    try {
      const { data, error } = await supabase.functions.invoke("verify-bin", {
        body: { image, expected_bin: BIN_COLORS[result.category] },
      });
      if (error) throw error;
      if (data.verified) {
        const pts = CATEGORY_POINTS[result.category] || 10;
        // Save scan
        await supabase.from("scans").insert({
          user_id: user.id,
          category: result.category,
          item_name: result.item_name,
          points_earned: pts,
          verified: true,
          needs_cleaning: result.needs_cleaning,
        });
        // Update points
        const { data: profile } = await supabase
          .from("profiles")
          .select("points")
          .eq("user_id", user.id)
          .single();
        await supabase
          .from("profiles")
          .update({ points: (profile?.points || 0) + pts })
          .eq("user_id", user.id);

        setPointsEarned(pts);
        setShowConfetti(true);
        setStep("done");
        refetch();
      } else {
        toast.error(`Please place the item in the ${BIN_COLORS[result.category]} bin and try again.`);
        setStep("verify");
      }
    } catch {
      toast.error("Verification failed. Please try again.");
      setStep("verify");
    }
  };

  const reset = () => {
    setStep("capture");
    setResult(null);
    setCapturedImage(null);
    setShowConfetti(false);
    setPointsEarned(0);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {showConfetti && <ConfettiOverlay />}

      {step === "capture" && (
        <div className="space-y-4">
          <div className="glass-card rounded-3xl overflow-hidden aspect-[4/3] relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!stream && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Button onClick={startCamera} className="rounded-2xl eco-gradient text-primary-foreground font-semibold gap-2 px-6 py-5">
                  <Camera className="w-5 h-5" /> Open Camera
                </Button>
              </div>
            )}
          </div>
          {stream && (
            <Button onClick={handleCapture} className="w-full rounded-2xl eco-gradient text-primary-foreground font-display font-semibold py-6 text-lg">
              <Camera className="mr-2 w-5 h-5" /> Capture & Analyze
            </Button>
          )}
        </div>
      )}

      {step === "analyzing" && (
        <div className="glass-card rounded-3xl p-10 text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
          <p className="font-display font-semibold text-lg">Analyzing your item...</p>
          <p className="text-sm text-muted-foreground">Our AI is identifying the waste category</p>
        </div>
      )}

      {step === "cleaning" && result && (
        <div className="glass-card rounded-3xl p-6 space-y-4 border-2 border-accent animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl accent-gradient flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Cleaning Required</h3>
              <p className="text-sm text-muted-foreground">{result.item_name} needs cleaning first</p>
            </div>
          </div>
          <div className="bg-accent/10 rounded-2xl p-4">
            <p className="text-sm">{result.cleaning_instructions || "Please rinse the item with water and remove any food residue before sorting."}</p>
          </div>
          <Button
            onClick={() => setStep("result")}
            className="w-full rounded-2xl eco-gradient text-primary-foreground font-semibold py-5"
          >
            <CheckCircle2 className="mr-2 w-5 h-5" /> I Have Cleaned It
          </Button>
        </div>
      )}

      {step === "result" && result && (
        <div className="glass-card rounded-3xl p-6 space-y-4 animate-scale-in">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl eco-gradient flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="font-display font-bold text-xl">{result.item_name}</h3>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {result.category} • +{CATEGORY_POINTS[result.category] || 10} points
            </div>
          </div>
          <div className="bg-muted rounded-2xl p-4 text-center">
            <p className="text-sm text-muted-foreground">Place in the <strong className="text-foreground">{BIN_COLORS[result.category]} Bin</strong></p>
          </div>
          <Button
            onClick={() => { setStep("verify"); startCamera(); }}
            className="w-full rounded-2xl eco-gradient text-primary-foreground font-semibold py-5"
          >
            <Camera className="mr-2 w-5 h-5" /> Verify Placement
          </Button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-4">
          <div className="glass-card rounded-3xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Take a photo of the item in the</p>
            <p className="font-display font-bold text-lg text-primary">{BIN_COLORS[result?.category || "Plastic"]} Bin</p>
          </div>
          <div className="glass-card rounded-3xl overflow-hidden aspect-[4/3]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <Button onClick={handleVerifyCapture} className="w-full rounded-2xl eco-gradient text-primary-foreground font-display font-semibold py-6 text-lg">
            <CheckCircle2 className="mr-2 w-5 h-5" /> Verify
          </Button>
        </div>
      )}

      {step === "verifying" && (
        <div className="glass-card rounded-3xl p-10 text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
          <p className="font-display font-semibold text-lg">Verifying placement...</p>
        </div>
      )}

      {step === "done" && (
        <div className="glass-card rounded-3xl p-8 text-center space-y-4 animate-scale-in">
          <div className="w-20 h-20 rounded-full eco-gradient flex items-center justify-center mx-auto eco-glow animate-glow-pulse">
            <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="font-display font-bold text-2xl">+{pointsEarned} Points!</h3>
          <p className="text-muted-foreground">Great job! You've made Goa cleaner 🌊</p>
          <Button onClick={reset} className="rounded-2xl eco-gradient text-primary-foreground font-semibold px-8 py-5">
            Scan Another Item
          </Button>
        </div>
      )}
    </div>
  );
}
