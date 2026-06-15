import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { storage, CurrentExamData, AnswerState } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGenerate } from "@workspace/api-client-react";
import { Loader2, ArrowRight, SkipForward, SendHorizonal, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRef } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ExamFlow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [examData, setExamData] = useState<CurrentExamData | null>(null);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // MCQ state
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  
  // Short answer state
  const [shortAnswerText, setShortAnswerText] = useState("");
  
  // Evaluation state for current question
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [currentEval, setCurrentEval] = useState<Omit<AnswerState, "questionIndex"> | null>(null);

  const [showExitDialog, setShowExitDialog] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const generate = useGenerate();

  useEffect(() => {
    const data = storage.getCurrentExam();
    if (!data || !data.questions.length) {
      setLocation("/dashboard");
      return;
    }
    setExamData(data);
    setAnswers(storage.getCurrentAnswers() || []);
  }, [setLocation]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  if (!examData) return null;

  const question = examData.questions[currentIndex];
  const isLastQuestion = currentIndex === examData.questions.length - 1;
  const progressPercent = ((currentIndex) / examData.questions.length) * 100;

  const handleSkip = () => {
    const newAnswer: AnswerState = {
      questionIndex: currentIndex,
      isCorrect: false,
      score: 0,
      userAnswer: "[Skipped]",
      verdict: "wrong",
      feedback: "You skipped this question."
    };
    
    saveAnswerAndProceed(newAnswer);
  };

  const handleCheckMCQ = () => {
    if (!selectedChoice) return;
    
    const isCorrect = selectedChoice === question.answer;
    
    setCurrentEval({
      isCorrect,
      score: isCorrect ? 1 : 0,
      userAnswer: selectedChoice,
      verdict: isCorrect ? "correct" : "wrong"
    });
    setIsEvaluated(true);
  };

  const handleCheckShortAnswer = async () => {
    if (!shortAnswerText.trim()) return;
    
    const prompt = `Grade this student answer. Respond with ONLY valid JSON, no markdown: { "verdict": "correct" or "partial" or "wrong", "feedback": "one sentence", "score": 0 or 0.5 or 1 }

Question: ${question.question}
Model answer: ${question.answer}
Student answer: ${shortAnswerText}`;

    try {
      const res = await generate.mutateAsync({ data: { prompt, maxTokens: 500 } });
      
      let cleanedText = res.text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\n/, "").replace(/\n```$/, "");
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\n/, "").replace(/\n```$/, "");
      }
      
      const parsed = JSON.parse(cleanedText);
      
      setCurrentEval({
        isCorrect: parsed.score === 1,
        score: parsed.score,
        userAnswer: shortAnswerText,
        verdict: parsed.verdict as "correct" | "partial" | "wrong",
        feedback: parsed.feedback
      });
      setIsEvaluated(true);
      
    } catch (err) {
      console.error(err);
      toast({
        title: "Grading failed",
        description: "Failed to parse AI grading response. Let's try again.",
        variant: "destructive"
      });
    }
  };

  const handleNext = () => {
    if (currentEval) {
      saveAnswerAndProceed({
        questionIndex: currentIndex,
        ...currentEval
      });
    }
  };

  const saveAnswerAndProceed = (answerState: AnswerState) => {
    const newAnswers = [...answers, answerState];
    setAnswers(newAnswers);
    storage.setCurrentAnswers(newAnswers);
    
    if (isLastQuestion) {
      setLocation("/results");
    } else {
      setCurrentIndex(curr => curr + 1);
      // Reset state for next question
      setSelectedChoice(null);
      setShortAnswerText("");
      setIsEvaluated(false);
      setCurrentEval(null);
      setChatMessages([]);
      setChatInput("");
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading || !currentEval) return;

    const userMessage = chatInput.trim();
    const newMessages: ChatMessage[] = [...chatMessages, { role: "user", content: userMessage }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    const prompt = `You are a patient, knowledgeable tutor helping a student understand a question they got wrong.

Question: ${question.question}
Correct answer: ${question.answer}  
Student's answer: ${currentEval.userAnswer}
Explanation: ${question.explanation}

Conversation so far:
${newMessages.map(m => m.role + ": " + m.content).join("\n")}

Student says: ${userMessage}

Respond as a helpful tutor. Be clear, use examples where helpful, ask a follow-up question to check understanding. Keep response under 200 words.`;

    try {
      const res = await generate.mutateAsync({ data: { prompt, maxTokens: 500 } });
      setChatMessages([...newMessages, { role: "assistant", content: res.text.trim() }]);
    } catch (err) {
      console.error(err);
      toast({
        title: "Chat failed",
        description: "Failed to get response from AI tutor.",
        variant: "destructive"
      });
    } finally {
      setChatLoading(false);
    }
  };

  const renderMCQOptions = () => {
    return (
      <div className="space-y-3 mt-8">
        {question.choices?.map((choice, idx) => {
          const isSelected = selectedChoice === choice;
          let btnClass = "w-full justify-start h-auto py-4 px-6 text-left whitespace-normal font-sans text-base border-2 transition-all";
          
          if (isEvaluated) {
            const isCorrectAnswer = choice === question.answer;
            if (isCorrectAnswer) {
              btnClass += " bg-green-50 border-green-500 text-green-900";
            } else if (isSelected && !isCorrectAnswer) {
              btnClass += " bg-red-50 border-red-500 text-red-900";
            } else {
              btnClass += " bg-background border-border opacity-50 cursor-not-allowed";
            }
          } else {
            if (isSelected) {
              btnClass += " bg-secondary/10 border-secondary text-foreground";
            } else {
              btnClass += " bg-card border-card-border hover:border-primary/30 text-foreground";
            }
          }

          return (
            <Button
              key={idx}
              variant="outline"
              className={btnClass}
              onClick={() => !isEvaluated && setSelectedChoice(choice)}
              disabled={isEvaluated}
              data-testid={`button-choice-${idx}`}
            >
              {choice}
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full bg-card border-b border-border sticky top-0 z-10">
        <Progress value={progressPercent} className="h-1 rounded-none bg-border" />
        <div className="max-w-4xl mx-auto px-4 py-4 grid grid-cols-3 items-center">
          <div className="justify-self-start">
            <Button variant="ghost" size="sm" onClick={() => setShowExitDialog(true)} className="text-muted-foreground hover:text-foreground">
              <X className="mr-2 w-4 h-4" /> Exit exam
            </Button>
          </div>
          <div className="justify-self-center">
            <span className="font-mono text-sm text-muted-foreground uppercase tracking-widest">
              Question {currentIndex + 1} of {examData.questions.length}
            </span>
          </div>
          <div className="justify-self-end">
            {!isEvaluated && (
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground hover:text-foreground">
                Skip <SkipForward className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit exam?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be lost and this session won't be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => setLocation("/dashboard")} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Exit anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="font-serif text-3xl md:text-5xl text-foreground leading-tight">
            {question.question}
          </h2>

          {question.type === "mcq" ? renderMCQOptions() : (
            <div className="space-y-4 mt-8">
              <Textarea
                placeholder="Type your answer here..."
                className="min-h-[200px] text-lg font-sans p-6 bg-card border-2 focus-visible:ring-primary shadow-sm"
                value={shortAnswerText}
                onChange={(e) => setShortAnswerText(e.target.value)}
                disabled={isEvaluated}
                data-testid="textarea-short-answer"
              />
            </div>
          )}

          {isEvaluated && currentEval && (
            <div className={`p-6 rounded-xl border-2 mt-8 animate-in fade-in slide-in-from-bottom-2 ${
              currentEval.verdict === "correct" ? "bg-green-50 border-green-200" :
              currentEval.verdict === "partial" ? "bg-amber-50 border-amber-200" :
              "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded ${
                  currentEval.verdict === "correct" ? "bg-green-200 text-green-900" :
                  currentEval.verdict === "partial" ? "bg-amber-200 text-amber-900" :
                  "bg-red-200 text-red-900"
                }`}>
                  {currentEval.verdict}
                </span>
                {currentEval.score > 0 && <span className="text-sm font-mono text-muted-foreground">Score: {currentEval.score}</span>}
              </div>
              
              {currentEval.feedback && (
                <p className="text-sm font-medium mb-3 text-foreground/80">{currentEval.feedback}</p>
              )}
              
              {question.explanation && (
                <div className="mt-4 pt-4 border-t border-black/10">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Explanation</span>
                  <p className="text-sm text-foreground/90">{question.explanation}</p>
                </div>
              )}
              
              {question.type === "short" && (
                <div className="mt-4 pt-4 border-t border-black/10">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Model Answer</span>
                  <p className="text-sm text-foreground/90">{question.answer}</p>
                </div>
              )}
            </div>
          )}

          {isEvaluated && currentEval && (currentEval.verdict === "wrong" || currentEval.verdict === "partial") && (
            <div className="bg-muted/30 rounded-xl border border-border p-4 mt-4 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Ask your AI tutor</h3>
              
              <div className="max-h-64 overflow-y-auto mb-4 space-y-4 pr-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`px-4 py-2 text-sm max-w-[80%] ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
                        : "bg-card border border-border rounded-2xl rounded-tl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] flex items-center gap-1">
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
              
              <div className="flex gap-2">
                <Textarea 
                  placeholder="Ask why you got this wrong, or ask for a deeper explanation…" 
                  className="min-h-[40px] h-[40px] resize-none flex-1 text-sm py-2"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  disabled={chatLoading}
                />
                <Button 
                  size="icon" 
                  className="shrink-0 bg-primary hover:bg-primary/90" 
                  onClick={handleSendChatMessage}
                  disabled={!chatInput.trim() || chatLoading}
                >
                  <SendHorizonal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="pt-8 flex justify-end">
            {!isEvaluated ? (
              <Button 
                onClick={question.type === "mcq" ? handleCheckMCQ : handleCheckShortAnswer}
                disabled={question.type === "mcq" ? !selectedChoice : !shortAnswerText.trim() || generate.isPending}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-14 text-lg"
                data-testid="button-check-answer"
              >
                {generate.isPending ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Checking...</>
                ) : "Check Answer"}
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-14 text-lg animate-pulse"
                data-testid="button-next"
              >
                {isLastQuestion ? "Finish Exam" : "Next Question"} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
