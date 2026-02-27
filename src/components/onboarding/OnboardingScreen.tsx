import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AVATARS = [
  { id: "avatar1", emoji: "🌱", label: "Sprout" },
  { id: "avatar2", emoji: "🌊", label: "Wave" },
  { id: "avatar3", emoji: "🌻", label: "Sunflower" },
  { id: "avatar4", emoji: "🐢", label: "Turtle" },
  { id: "avatar5", emoji: "🦋", label: "Butterfly" },
  { id: "avatar6", emoji: "🌍", label: "Earth" },
];

export function OnboardingScreen() {
  const { updateProfile } = useProfile();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("avatar1");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const handleComplete = async () => {
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    setLoading(true);
    const error = await updateProfile({
      display_name: name.trim(),
      city: city.trim() || null,
      avatar_id: selectedAvatar,
      onboarding_complete: true,
    });
    setLoading(false);
    if (error) toast.error("Something went wrong");
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-6">
      <div className="glass-card-strong rounded-3xl p-8 max-w-md w-full space-y-6 animate-scale-in">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl font-bold text-foreground">
            {step === 0 ? "Choose Your Avatar" : "Tell Us About You"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {step === 0 ? "Pick your eco warrior identity" : "Almost there!"}
          </p>
          <div className="flex gap-2 justify-center pt-2">
            {[0, 1].map((s) => (
              <div key={s} className={`h-1.5 w-10 rounded-full transition-colors ${s <= step ? "eco-gradient" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        {step === 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all hover:scale-105 ${
                    selectedAvatar === av.id
                      ? "border-primary bg-primary/10 shadow-md eco-glow"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <span className="text-4xl">{av.emoji}</span>
                  <span className="text-xs font-medium text-muted-foreground">{av.label}</span>
                </button>
              ))}
            </div>
            <Button onClick={() => setStep(1)} className="w-full rounded-xl eco-gradient text-primary-foreground font-semibold py-5">
              Next <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center text-5xl mb-4">
              {AVATARS.find((a) => a.id === selectedAvatar)?.emoji}
            </div>
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>City (optional)</Label>
              <Input placeholder="e.g. Panaji, Goa" value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1 rounded-xl">
                Back
              </Button>
              <Button onClick={handleComplete} className="flex-1 rounded-xl eco-gradient text-primary-foreground font-semibold" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Let's Go!
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
