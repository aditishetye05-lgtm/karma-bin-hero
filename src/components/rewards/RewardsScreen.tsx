import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bus, Bike, ShoppingCart, Ticket, Loader2, Gift } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ICONS: Record<string, typeof Bus> = {
  bus: Bus, bike: Bike, "shopping-cart": ShoppingCart, ticket: Ticket,
};

const CATEGORY_COLORS: Record<string, string> = {
  transport: "from-eco-sky to-eco-emerald",
  groceries: "from-eco-leaf to-eco-green",
  utility: "from-eco-amber to-eco-earth",
};

interface Reward {
  id: string;
  title: string;
  description: string | null;
  category: string;
  points_cost: number;
  icon: string | null;
}

export function RewardsScreen() {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [qrDialog, setQrDialog] = useState<{ code: string; title: string; expires: string } | null>(null);

  useEffect(() => {
    supabase.from("rewards").select("*").eq("active", true).then(({ data }) => {
      setRewards(data || []);
      setLoading(false);
    });
  }, []);

  const redeem = async (reward: Reward) => {
    if (!user || !profile) return;
    if (profile.points < reward.points_cost) {
      toast.error("Not enough points!");
      return;
    }
    setRedeeming(reward.id);
    const qrCode = `ECO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: rError } = await supabase.from("redemptions").insert({
      user_id: user.id,
      reward_id: reward.id,
      qr_code: qrCode,
      expires_at: expiresAt,
    });

    if (!rError) {
      await supabase
        .from("profiles")
        .update({ points: profile.points - reward.points_cost })
        .eq("user_id", user.id);
      refetch();
      setQrDialog({ code: qrCode, title: reward.title, expires: expiresAt });
      toast.success("Reward redeemed!");
    } else {
      toast.error("Failed to redeem reward");
    }
    setRedeeming(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass-card rounded-3xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl eco-gradient flex items-center justify-center eco-glow">
          <Gift className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Your Balance</p>
          <p className="font-display text-2xl font-bold">{profile?.points ?? 0} points</p>
        </div>
      </div>

      <h3 className="font-display font-semibold text-lg px-1">Available Rewards</h3>

      <div className="space-y-3">
        {rewards.map((reward) => {
          const Icon = ICONS[reward.icon || "ticket"] || Ticket;
          const canAfford = (profile?.points ?? 0) >= reward.points_cost;
          return (
            <div key={reward.id} className="glass-card rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[reward.category] || "from-primary to-eco-emerald"} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-semibold text-sm">{reward.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{reward.description}</p>
              </div>
              <Button
                size="sm"
                onClick={() => redeem(reward)}
                disabled={!canAfford || redeeming === reward.id}
                className={`rounded-xl text-xs font-semibold px-4 ${canAfford ? "eco-gradient text-primary-foreground" : ""}`}
                variant={canAfford ? "default" : "outline"}
              >
                {redeeming === reward.id ? <Loader2 className="w-3 h-3 animate-spin" /> : `${reward.points_cost} pts`}
              </Button>
            </div>
          );
        })}
      </div>

      {/* QR Dialog */}
      <Dialog open={!!qrDialog} onOpenChange={() => setQrDialog(null)}>
        <DialogContent className="glass-card-strong rounded-3xl sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">🎉 Reward Redeemed!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="font-semibold">{qrDialog?.title}</p>
            <div className="mx-auto w-48 h-48 rounded-2xl bg-foreground/5 border-2 border-dashed border-primary/30 flex items-center justify-center animate-glow-pulse">
              <div className="text-center">
                <p className="font-mono text-sm font-bold text-primary break-all px-2">{qrDialog?.code}</p>
                <p className="text-xs text-muted-foreground mt-2">Show this code to redeem</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Expires: {qrDialog?.expires ? new Date(qrDialog.expires).toLocaleString() : ""}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
