import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, AlertTriangle, CheckCircle2, ImagePlus, ScanBarcode } from "lucide-react";
import { toast } from "sonner";
import { ConfettiOverlay } from "./ConfettiOverlay";
import { ScanResultCard } from "./ScanResultCard";
import { FeedbackPanel } from "./FeedbackPanel";
import { BarcodeScanner } from "./BarcodeScanner";

const CATEGORY_POINTS: Record<string, number> = {
  Plastic: 40, "E-waste": 50, Metal: 20, Glass: 20, Paper: 10, Wet: 5,
};

const BIN_COLORS: Record<string, { color: string; hex: string }> = {
  Plastic: { color: "Blue", hex: "#3b82f6" },
  Paper: { color: "Blue", hex: "#3b82f6" },
  Glass: { color: "Green", hex: "#22c55e" },
  Metal: { color: "Yellow", hex: "#eab308" },
  "E-waste": { color: "Red", hex: "#ef4444" },
  Wet: { color: "Green", hex: "#22c55e" },
};

type ScanStep = "capture" | "analyzing" | "result" | "cleaning" | "verify" | "verifying" | "done";

export interface ScanResult {
  category: string;
  item_name: string;
  item_type?: string;
  material?: string;
  recyclability?: string;
  confidence?: number;
  needs_cleaning: boolean;
  cleaning_instructions?: string;
  disposal_recommendation?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const verifyFileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);

  const handleBarcodeScan = async (code: string) => {
    setShowBarcode(false);
    setCapturedImage(null);
    setStep("analyzing");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-waste", {
        body: { barcode: code },
      });
      if (error) throw error;
      setResult(data as ScanResult);
      setStep(data.needs_cleaning ? "cleaning" : "result");
    } catch {
      toast.error("Could not identify item from barcode. Try scanning with camera instead.");
      setStep("capture");
    }
  };

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
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      toast.error("Camera not ready. Please wait and try again.");
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    if (!dataUrl || dataUrl === "data:," || dataUrl.length < 100) {
      toast.error("Failed to capture image. Please try again.");
      return null;
    }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      await analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleVerifyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await handleVerifyCapture(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleVerifyCapture = async (uploadedImage?: string) => {
    const image = uploadedImage || capturePhoto();
    if (!image || !result || !user) return;
    setStep("verifying");
    try {
      const { data, error } = await supabase.functions.invoke("verify-bin", {
        body: { image, expected_bin: BIN_COLORS[result.category]?.color },
      });
      if (error) throw error;
      if (data.verified) {
        const pts = CATEGORY_POINTS[result.category] || 10;
        const { data: scanData } = await supabase.from("scans").insert({
          user_id: user.id,
          category: result.category,
          item_name: result.item_name,
          item_type: result.item_type || null,
          material: result.material || null,
          recyclability: result.recyclability || null,
          confidence: result.confidence || null,
          disposal_recommendation: result.disposal_recommendation || null,
          points_earned: pts,
          verified: true,
          needs_cleaning: result.needs_cleaning,
        }).select("id").single();

        if (scanData) setScanId(scanData.id);

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
    setScanId(null);
    setShowFeedback(false);
    setShowBarcode(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {showConfetti && <ConfettiOverlay />}

      {step === "capture" && (
        <div className="space-y-4">
          <div className="glass-card rounded-3xl overflow-hidden aspect-[4/3] relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!stream && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted gap-3 flex-col">
                <Button onClick={startCamera} className="rounded-2xl eco-gradient text-primary-foreground font-semibold gap-2 px-6 py-5">
                  <Camera className="w-5 h-5" /> Open Camera
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-2xl font-semibold gap-2 px-6 py-5">
                  <ImagePlus className="w-5 h-5" /> Upload Photo
                </Button>
                <Button onClick={() => setShowBarcode(true)} variant="outline" className="rounded-2xl font-semibold gap-2 px-6 py-5">
                  <ScanBarcode className="w-5 h-5" /> Scan Barcode
                </Button>
              </div>
            )}
          </div>
          {stream && (
            <div className="flex gap-3">
              <Button onClick={handleCapture} className="flex-1 rounded-2xl eco-gradient text-primary-foreground font-display font-semibold py-6 text-lg">
                <Camera className="mr-2 w-5 h-5" /> Capture & Analyze
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-2xl font-semibold py-6">
                <ImagePlus className="w-5 h-5" />
              </Button>
              <Button onClick={() => { stopCamera(); setShowBarcode(true); }} variant="outline" className="rounded-2xl font-semibold py-6">
                <ScanBarcode className="w-5 h-5" />
              </Button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

          {showBarcode && (
            <BarcodeScanner
              onScan={handleBarcodeScan}
              onClose={() => setShowBarcode(false)}
            />
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
        <div className="space-y-4">
          <ScanResultCard
            result={result}
            categoryPoints={CATEGORY_POINTS}
            binColors={BIN_COLORS}
            onVerify={() => { setStep("verify"); startCamera(); }}
          />
          {user && (
            <FeedbackPanel
              result={result}
              userId={user.id}
              showFeedback={showFeedback}
              onToggle={() => setShowFeedback(!showFeedback)}
              showCorrectionByDefault
            />
          )}
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-4">
          <div className="glass-card rounded-3xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Take a photo of the item in the</p>
            <p className="font-display font-bold text-lg" style={{ color: BIN_COLORS[result?.category || "Plastic"]?.hex }}>{BIN_COLORS[result?.category || "Plastic"]?.color} Bin</p>
          </div>
          <div className="glass-card rounded-3xl overflow-hidden aspect-[4/3]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <Button onClick={() => handleVerifyCapture()} className="w-full rounded-2xl eco-gradient text-primary-foreground font-display font-semibold py-6 text-lg">
            <CheckCircle2 className="mr-2 w-5 h-5" /> Verify
          </Button>
          <Button onClick={() => verifyFileInputRef.current?.click()} variant="outline" className="w-full rounded-2xl font-semibold py-5 gap-2">
            <ImagePlus className="w-5 h-5" /> Upload Verification Photo
          </Button>
          <input ref={verifyFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleVerifyFileUpload} />
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

          {result && scanId && user && (
            <FeedbackPanel
              result={result}
              scanId={scanId}
              userId={user.id}
              showFeedback={showFeedback}
              onToggle={() => setShowFeedback(!showFeedback)}
            />
          )}

          <Button onClick={reset} className="rounded-2xl eco-gradient text-primary-foreground font-semibold px-8 py-5">
            Scan Another Item
          </Button>
        </div>
      )}
    </div>
  );
}
