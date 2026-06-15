import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useGenerate } from "@workspace/api-client-react";
import { Loader2, BookOpen, Clock, Target, PlusCircle, CheckCircle2, History, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { supabase, ExamRecord } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();
  
  const [history, setHistory] = useState<ExamRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const [notes, setNotes] = useState("");
  const [numQuestions, setNumQuestions] = useState("10");
  const [numQuestionsError, setNumQuestionsError] = useState(false);
  const [questionType, setQuestionType] = useState("Mixed");
  const [difficulty, setDifficulty] = useState("Standard");
  
  const generate = useGenerate();

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchHistory();
    
    const retryTopic = storage.getRetryTopic();
    if (retryTopic) {
      setNotes(retryTopic);
      storage.setRetryTopic(""); // clear after loading
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await supabase.from('exams').delete().eq('id', id);
      setHistory(prev => prev.filter(h => h.id !== id));
      toast({ title: "Exam deleted" });
    } catch (err) {
      console.error("Failed to delete exam", err);
      toast({ title: "Failed to delete exam", variant: "destructive" });
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    try {
      await supabase.from('exams').delete().eq('user_id', user.id);
      setHistory([]);
      toast({ title: "History cleared" });
    } catch (err) {
      console.error("Failed to clear history", err);
      toast({ title: "Failed to clear history", variant: "destructive" });
    }
  };

  const handleGenerate = async () => {
    if (!notes.trim() || !profile) {
      toast({
        title: "Please enter some notes or a topic",
        variant: "destructive"
      });
      return;
    }

    const num = parseInt(numQuestions, 10);
    if (isNaN(num) || num < 1 || num > 30) {
      setNumQuestionsError(true);
      return;
    }
    setNumQuestionsError(false);

    const questionTypeInstruction =
      questionType === "MCQ only"
        ? 'All questions must be type "mcq".'
        : questionType === "Short answer only"
          ? 'All questions must be type "short".'
          : 'Mix both "mcq" and "short" types.';

    const prompt = `You are an expert ${profile.curriculum} examiner creating practice questions for ${profile.year} students.

Generate exactly ${numQuestions} exam questions based on the source material below.
Difficulty level: ${difficulty}.
${questionTypeInstruction}

Return ONLY a raw JSON array — no markdown, no code fences, no explanation, nothing before or after the array.

Each element must follow this exact shape:
{"type":"mcq","question":"...","choices":["option A","option B","option C","option D"],"answer":"option A","explanation":"..."}
or for short answer:
{"type":"short","question":"...","choices":null,"answer":"model answer","explanation":"..."}

Source material:
${notes}`;

    try {
      const res = await generate.mutateAsync({
        data: { prompt, maxTokens: 4000 }
      });

      let cleanedText = res.text.trim();
      cleanedText = cleanedText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let parsedQuestions: unknown;
      try {
        parsedQuestions = JSON.parse(cleanedText);
      } catch (parseErr) {
        console.error("JSON parse failed. Raw AI text:", cleanedText);
        throw new Error(`Could not parse AI response as JSON: ${String(parseErr)}`);
      }

      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        console.error("Unexpected shape — not an array:", parsedQuestions);
        throw new Error("AI returned an unexpected format (expected a JSON array).");
      }

      storage.setCurrentExam({
        topic: notes.slice(0, 60) + (notes.length > 60 ? "..." : ""),
        questions: parsedQuestions as never,
        profile
      });

      storage.setCurrentAnswers([]);
      setLocation("/exam");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Exam generation error:", err);
      toast({
        title: "Failed to generate exam",
        description: msg,
        variant: "destructive"
      });
    }
  };

  if (!profile) return null;

  const totalExams = history.length;
  const avgScore = totalExams ? Math.round(history.reduce((acc, h) => acc + h.score_pct, 0) / totalExams) : 0;
  const totalQuestions = history.reduce((acc, h) => acc + h.total_questions, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Topbar */}
      <header className="bg-card border-b border-border px-6 py-3 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-serif text-xl text-primary">Paperset</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">{profile.name}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
            Sign out
          </Button>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-80 bg-sidebar border-r border-sidebar-border p-6 flex flex-col shrink-0 overflow-y-auto">
          <h2 className="text-xl font-medium text-sidebar-foreground mb-6 font-serif">
            {getGreeting()}
          </h2>

          <div className="space-y-4 mb-8">
            <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <Target className="w-4 h-4" /> Average Score
                </span>
                <span className="font-bold text-lg">{avgScore}%</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <History className="w-4 h-4" /> Exams Taken
                </span>
                <span className="font-bold text-lg">{totalExams}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Questions Answered
                </span>
                <span className="font-bold text-lg">{totalQuestions}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Recent Practice</h3>
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 px-4 text-muted-foreground bg-black/5 rounded-lg border border-dashed border-black/10">
                <p className="text-sm">No exams taken yet.</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {history.map((item) => (
                  <div key={item.id} className="bg-card border border-card-border p-3 rounded-lg shadow-sm group relative">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm truncate pr-6" title={item.topic}>{item.topic}</span>
                      <span className={`text-sm font-bold ${
                        item.score_pct >= 70 ? "text-green-600" : item.score_pct >= 50 ? "text-amber-600" : "text-red-600"
                      }`}>
                        {item.score_pct}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(item.created_at).toLocaleDateString()}</span>
                      <span>{item.total_questions} Qs</span>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete exam record?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this practice session from your history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
            
            {history.length > 0 && (
              <div className="pt-4 mt-auto">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                      Clear all history
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your past practice exams. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Clear everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <div>
              <h1 className="font-serif text-4xl text-primary mb-2">New Practice Session</h1>
              <p className="text-muted-foreground">Configure your exam parameters and provide the study material.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Source Material</label>
                <Textarea 
                  placeholder="Paste your notes, a topic name, or study material here..."
                  className="min-h-[250px] font-sans text-base resize-y bg-card focus-visible:ring-primary shadow-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="textarea-notes"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Number of questions</label>
                  <Input 
                    type="number"
                    min="1"
                    max="30"
                    placeholder="e.g. 10"
                    value={numQuestions}
                    onChange={(e) => {
                      setNumQuestions(e.target.value);
                      const num = parseInt(e.target.value, 10);
                      setNumQuestionsError(isNaN(num) || num < 1 || num > 30);
                    }}
                    className={`bg-card ${numQuestionsError ? "border-red-500" : ""}`}
                  />
                  {numQuestionsError && (
                    <p className="text-xs text-red-500">Enter a number between 1 and 30</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Question type</label>
                  <Select value={questionType} onValueChange={setQuestionType}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                      <SelectItem value="MCQ only">MCQ only</SelectItem>
                      <SelectItem value="Short answer only">Short answer only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Difficulty</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                      <SelectItem value="Exam-level">Exam-level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleGenerate} 
                  disabled={generate.isPending}
                  size="lg"
                  className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base"
                  data-testid="button-generate"
                >
                  {generate.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Preparing your exam...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5 mr-2" />
                      Generate Exam
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
