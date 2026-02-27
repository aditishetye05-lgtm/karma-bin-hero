import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { LandingPage } from "@/components/landing/LandingPage";
import { AuthModal } from "@/components/auth/AuthModal";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [showAuth, setShowAuth] = useState(false);

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage onGetStarted={() => setShowAuth(true)} />
        <AuthModal open={showAuth} onOpenChange={setShowAuth} />
      </>
    );
  }

  if (!profile?.onboarding_complete) {
    return <OnboardingScreen />;
  }

  return <DashboardLayout />;
};

export default Index;
