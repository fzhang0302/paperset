import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const CURRICULUMS = ["IGCSE", "A-Level", "AP", "IB", "GCSE", "SAT/ACT", "University", "Other"];
const YEARS = [
  "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", 
  "Year 12", "Year 13", "Uni Year 1", "Uni Year 2", "Uni Year 3+"
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user, profile, refreshProfile } = useAuth();
  
  const [curriculum, setCurriculum] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If they already have a profile, go straight to dashboard
    if (profile) {
      setLocation("/dashboard");
    }
  }, [profile, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !curriculum || !year) return;
    
    setLoading(true);
    setError(null);
    
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Student';
    
    try {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          name, 
          curriculum, 
          year 
        });

      if (upsertError) throw upsertError;
      
      await refreshProfile();
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
      setLoading(false);
    }
  };

  if (profile) return null; // render nothing while redirecting

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-secondary opacity-50" />
      <div className="absolute bottom-20 right-20 w-3 h-3 rounded-full bg-secondary opacity-30" />
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-primary opacity-20" />
      
      <Card className="w-full max-w-md border-border shadow-xl z-10 bg-card">
        <CardHeader className="space-y-4 text-center pb-8 pt-8">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="font-serif text-4xl text-primary font-normal tracking-tight">Welcome</CardTitle>
            <CardDescription className="text-muted-foreground mt-2 font-sans">
              Let's tailor Paperset to your needs.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="curriculum" className="text-foreground">Your curriculum</Label>
              <Select value={curriculum} onValueChange={setCurriculum} required>
                <SelectTrigger className="bg-background border-input focus-visible:ring-primary" data-testid="select-curriculum">
                  <SelectValue placeholder="Select curriculum" />
                </SelectTrigger>
                <SelectContent>
                  {CURRICULUMS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year" className="text-foreground">Current year</Label>
              <Select value={year} onValueChange={setYear} required>
                <SelectTrigger className="bg-background border-input focus-visible:ring-primary" data-testid="select-year">
                  <SelectValue placeholder="Select year or grade" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid="button-get-started"
              disabled={!curriculum || !year || loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Complete setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
