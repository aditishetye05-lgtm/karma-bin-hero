import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Recycle, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email for a password reset link!");
        setMode("login");
      }
      return;
    }

    const { error } = mode === "login" ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (mode === "signup") {
      toast.success("Check your email to confirm your account!");
    } else {
      onOpenChange(false);
    }
  };

  const title = mode === "login" ? "Welcome Back" : mode === "signup" ? "Join EcoSort" : "Reset Password";
  const subtitle = mode === "login"
    ? "Sign in to continue your eco journey"
    : mode === "signup"
    ? "Create an account and start earning rewards"
    : "Enter your email and we'll send a reset link";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card-strong sm:max-w-md rounded-3xl border-border/20">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl eco-gradient flex items-center justify-center shadow-lg">
            <Recycle className="w-7 h-7 text-primary-foreground" />
          </div>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 rounded-xl" required />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 rounded-xl" required minLength={6} />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full rounded-xl eco-gradient text-primary-foreground font-semibold py-5" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
          </Button>
        </form>

        <div className="text-center pt-2 space-y-1">
          {mode === "login" && (
            <button type="button" onClick={() => setMode("forgot")} className="text-sm text-muted-foreground hover:text-primary hover:underline block mx-auto">
              Forgot password?
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode(mode === "login" || mode === "forgot" ? (mode === "forgot" ? "login" : "signup") : "login")}
            className="text-sm text-primary hover:underline"
          >
            {mode === "login" ? "Don't have an account? Sign up" : mode === "signup" ? "Already have an account? Sign in" : "Back to sign in"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
