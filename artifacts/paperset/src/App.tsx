import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import ExamFlow from "@/pages/Exam";
import Results from "@/pages/Results";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import { AuthProvider, useAuth } from "@/lib/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (location === "/") {
      if (user) setLocation("/dashboard");
    } else if (location === "/login" || location === "/signup") {
      if (user) {
        if (profile) setLocation("/dashboard");
        else setLocation("/onboarding");
      }
    } else if (location === "/dashboard" || location === "/exam" || location === "/results" || location === "/onboarding") {
      if (!user) {
        setLocation("/");
      } else if (location !== "/onboarding" && !profile) {
        setLocation("/onboarding");
      }
    }
  }, [location, setLocation, user, profile, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <AuthGuard>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/exam" component={ExamFlow} />
        <Route path="/results" component={Results} />
        <Route component={NotFound} />
      </Switch>
    </AuthGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
