import { useState } from "react";
import { Link, useLocation } from "wouter";
import { SiGoogle } from "react-icons/si";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const [, setLocation] = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailNotConfirmed(false);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Let AuthGuard handle the redirect based on whether profile exists
      setLocation("/dashboard");
    } catch (err: any) {
      const msg: string = err.message || "";
      if (msg.toLowerCase().includes("email not confirmed")) {
        setEmailNotConfirmed(true);
        setError("Your email address hasn't been confirmed yet.");
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      setResendSent(true);
    } catch {
      // silently ignore — resend is best-effort
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to log in with Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card shadow-xl border-border">
        <CardHeader className="space-y-4 text-center pb-6">
          <Link href="/" className="inline-flex justify-center cursor-pointer">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
          </Link>
          <div>
            <CardTitle className="font-serif text-3xl text-primary font-normal tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Log in to continue your practice
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">{error}</p>
                {emailNotConfirmed && (
                  <div className="text-sm text-muted-foreground">
                    {resendSent ? (
                      <p className="text-primary font-medium">Confirmation email sent — check your inbox.</p>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleResend}
                        disabled={resendLoading || !email}
                      >
                        {resendLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                        Resend confirmation email
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <Button type="submit" className="w-full bg-primary" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sign in
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <SiGoogle className="w-4 h-4 mr-2" />
            Continue with Google
          </Button>
          
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
