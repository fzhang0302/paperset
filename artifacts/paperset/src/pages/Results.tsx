import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { storage, CurrentExamData, AnswerState } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCcw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function Results() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [examData, setExamData] = useState<CurrentExamData | null>(null);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const data = storage.getCurrentExam();
    const ans = storage.getCurrentAnswers();
    
    if (!data || !ans || !ans.length) {
      setLocation("/dashboard");
      return;
    }
    
    setExamData(data);
    setAnswers(ans);
    
    if (!hasSaved) {
      const totalScore = ans.reduce((acc, curr) => acc + curr.score, 0);
      const percentScore = Math.round((totalScore / data.questions.length) * 100);
      
      // Save to Supabase instead of local storage
      const saveExamRecord = async () => {
        try {
          await supabase.from('exams').insert({
            user_id: user.id,
            topic: data.topic,
            score_pct: percentScore,
            total_questions: data.questions.length,
            correct_answers: totalScore,
            questions: data.questions,
          });
        } catch (err) {
          console.error("Failed to save exam results", err);
        }
      };
      
      saveExamRecord();
      setHasSaved(true);
    }
  }, [user, setLocation, hasSaved]);

  if (!examData || answers.length === 0) return null;

  const totalScore = answers.reduce((acc, curr) => acc + curr.score, 0);
  const percentScore = Math.round((totalScore / examData.questions.length) * 100);

  let title = "More practice needed";
  let colorClass = "text-red-500";
  let bgClass = "bg-red-50 border-red-200";
  
  if (percentScore >= 70) {
    title = "Great work!";
    colorClass = "text-green-600";
    bgClass = "bg-green-50 border-green-200";
  } else if (percentScore >= 50) {
    title = "Keep going";
    colorClass = "text-amber-500";
    bgClass = "bg-amber-50 border-amber-200";
  }

  const handleRetry = () => {
    storage.setRetryTopic(examData.topic);
    setLocation("/dashboard");
  };

  const handleNewExam = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center mb-16 text-center animate-in fade-in slide-in-from-bottom-8">
          <div className="relative w-48 h-48 mb-8">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="45"
                fill="transparent"
                stroke="currentColor"
                className="text-border"
                strokeWidth="10"
              />
              <circle
                cx="50" cy="50" r="45"
                fill="transparent"
                stroke="currentColor"
                className={`${colorClass} transition-all duration-1000 ease-out`}
                strokeWidth="10"
                strokeDasharray={`${percentScore * 2.827} 282.7`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={`text-5xl font-bold font-sans ${colorClass}`}>{percentScore}%</span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">Score</span>
            </div>
          </div>
          
          <h1 className="font-serif text-5xl text-foreground mb-4">{title}</h1>
          <p className="text-muted-foreground max-w-lg mb-8">
            You scored {totalScore} out of {examData.questions.length} on your practice session for "{examData.topic}".
          </p>
          
          <div className="flex gap-4">
            <Button onClick={handleNewExam} variant="outline" size="lg" className="h-12 px-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            <Button onClick={handleRetry} size="lg" className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground">
              <RotateCcw className="w-4 h-4 mr-2" /> Retry this topic
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="font-serif text-3xl text-foreground border-b border-border pb-4">Detailed Review</h2>
          
          <div className="space-y-6">
            {examData.questions.map((q, idx) => {
              const ans = answers[idx];
              if (!ans) return null;
              
              const isCorrect = ans.verdict === "correct";
              const isPartial = ans.verdict === "partial";
              
              return (
                <div key={idx} className={`p-6 rounded-xl border ${
                  isCorrect ? "bg-green-50/50 border-green-200" :
                  isPartial ? "bg-amber-50/50 border-amber-200" :
                  "bg-red-50/50 border-red-200"
                }`}>
                  <div className="flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      {isCorrect ? <CheckCircle2 className="w-6 h-6 text-green-600" /> :
                       isPartial ? <AlertCircle className="w-6 h-6 text-amber-500" /> :
                       <XCircle className="w-6 h-6 text-red-500" />}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <span className="text-sm font-mono font-medium text-muted-foreground mb-2 block">Question {idx + 1}</span>
                        <p className="text-lg font-medium text-foreground">{q.question}</p>
                      </div>
                      
                      <div className="bg-white/60 p-4 rounded-lg border border-black/5">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Your Answer</span>
                        <p className="text-sm">{ans.userAnswer}</p>
                        
                        {!isCorrect && ans.feedback && (
                          <p className="text-sm text-red-600 mt-2 font-medium">{ans.feedback}</p>
                        )}
                      </div>
                      
                      {(!isCorrect || q.explanation) && (
                        <div className="bg-white/60 p-4 rounded-lg border border-black/5">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Correct Answer</span>
                          <p className="text-sm font-medium">{q.answer}</p>
                          {q.explanation && <p className="text-sm text-muted-foreground mt-2">{q.explanation}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
