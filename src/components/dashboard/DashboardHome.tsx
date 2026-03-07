import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScanLine, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { HowToUseGuide } from "./HowToUseGuide";

const CATEGORY_COLORS: Record<string, string> = {
  Plastic: "#3b82f6",
  Paper: "#f59e0b",
  Wet: "#22c55e",
  Glass: "#8b5cf6",
  Metal: "#6b7280",
  "E-waste": "#ef4444",
};

const CATEGORY_POINTS: Record<string, number> = {
  Plastic: 40, "E-waste": 50, Metal: 20, Glass: 20, Paper: 10, Wet: 5,
};

interface DashboardHomeProps {
  onScan: () => void;
}

export function DashboardHome({ onScan }: DashboardHomeProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [scans, setScans] = useState<{ category: string; count: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("scans")
      .select("category")
      .eq("user_id", user.id)
      .eq("verified", true)
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<string, number> = {};
        data.forEach((s) => { counts[s.category] = (counts[s.category] || 0) + 1; });
        setScans(Object.entries(counts).map(([category, count]) => ({ category, count })));
      });
  }, [user]);

  const totalScans = scans.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* How to Use Guide */}
      <HowToUseGuide />
      {/* Points Card */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 eco-gradient opacity-10" />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Points</p>
              <p className="font-display text-4xl font-bold text-foreground">{profile?.points ?? 0}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl eco-gradient flex items-center justify-center eco-glow">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {Object.entries(CATEGORY_POINTS).slice(0, 3).map(([cat, pts]) => (
              <div key={cat} className="bg-muted/50 rounded-xl p-2">
                <p className="text-xs text-muted-foreground">{cat}</p>
                <p className="font-display font-bold text-sm text-primary">+{pts}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scan Button */}
      <Button
        onClick={onScan}
        className="w-full rounded-2xl eco-gradient text-primary-foreground font-display font-semibold text-lg py-7 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <ScanLine className="mr-2 w-5 h-5" />
        Scan Item
      </Button>

      {/* Pie Chart */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Recycling History</h3>
        {scans.length > 0 ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scans}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {scans.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <ScanLine className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No scans yet. Start scanning to see your stats!</p>
          </div>
        )}
        {scans.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {scans.map((s) => (
              <div key={s.category} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[s.category] }} />
                <span className="text-muted-foreground">{s.category} ({s.count})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="font-display text-2xl font-bold text-foreground">{totalScans}</p>
          <p className="text-xs text-muted-foreground">Items Sorted</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="font-display text-2xl font-bold text-primary">{scans.length}</p>
          <p className="text-xs text-muted-foreground">Categories</p>
        </div>
      </div>
    </div>
  );
}
