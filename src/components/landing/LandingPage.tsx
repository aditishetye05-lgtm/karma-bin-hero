import { Leaf, Recycle, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero gradient background */}
      <div className="absolute inset-0 hero-gradient opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(142,71%,45%,0.3),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(160,84%,39%,0.2),transparent_50%)]" />

      {/* Floating shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-eco-leaf/20 blur-xl animate-float" />
      <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-eco-emerald/15 blur-2xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-32 left-1/4 w-24 h-24 rounded-full bg-eco-amber/20 blur-xl animate-float" style={{ animationDelay: "4s" }} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl eco-gradient flex items-center justify-center shadow-lg">
              <Recycle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-primary-foreground">EcoSort</span>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-2xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground/90 text-sm font-medium animate-fade-in">
              <Leaf className="w-4 h-4" />
              <span>Powered by AI • Made for Goa</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground leading-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Sort Smart.{" "}
              <span className="text-accent">Earn Rewards.</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Scan your waste with AI, sort it correctly, and earn points for real rewards. Let's keep Goa clean together.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-display font-semibold text-lg px-8 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              {[
                { icon: Recycle, label: "Categories", value: "6" },
                { icon: Trophy, label: "Reward Types", value: "4" },
                { icon: Leaf, label: "AI Powered", value: "✓" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="w-5 h-5 text-accent mx-auto mb-1" />
                  <div className="font-display text-2xl font-bold text-primary-foreground">{stat.value}</div>
                  <div className="text-primary-foreground/60 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
