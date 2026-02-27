import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Recycle, Home, ScanLine, Gift, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHome } from "./DashboardHome";
import { ScanFlow } from "../scan/ScanFlow";
import { RewardsScreen } from "../rewards/RewardsScreen";

const AVATARS: Record<string, string> = {
  avatar1: "🌱", avatar2: "🌊", avatar3: "🌻",
  avatar4: "🐢", avatar5: "🦋", avatar6: "🌍",
};

type Tab = "home" | "scan" | "rewards";

export function DashboardLayout() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const [tab, setTab] = useState<Tab>("home");
  const [darkMode, setDarkMode] = useState(false);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const tabs: { id: Tab; icon: typeof Home; label: string }[] = [
    { id: "home", icon: Home, label: "Home" },
    { id: "scan", icon: ScanLine, label: "Scan" },
    { id: "rewards", icon: Gift, label: "Rewards" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 glass-card-strong border-b border-border/20 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl eco-gradient flex items-center justify-center">
              <Recycle className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display font-semibold text-sm leading-tight">{profile?.display_name || "Eco Warrior"}</p>
              <p className="text-xs text-muted-foreground">{profile?.city || "Goa"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-display font-bold text-sm">
              <span className="text-base">{AVATARS[profile?.avatar_id || "avatar1"]}</span>
              <span>{profile?.points ?? 0} pts</span>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleDark} className="rounded-xl h-9 w-9">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl h-9 w-9">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-4 pb-24">
        {tab === "home" && <DashboardHome onScan={() => setTab("scan")} />}
        {tab === "scan" && <ScanFlow />}
        {tab === "rewards" && <RewardsScreen />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50 glass-card-strong border-t border-border/20">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
                tab === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{t.label}</span>
              {tab === t.id && <div className="w-6 h-0.5 rounded-full eco-gradient mt-0.5" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
