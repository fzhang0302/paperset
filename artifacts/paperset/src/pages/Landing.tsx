import { Link } from "wouter";
import { BookOpen, CheckCircle2, TrendingUp, MessageCircle, FileText, Wand2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="w-5 h-5" />
            <span className="font-serif text-xl">Paperset</span>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Log in
            </Link>
            <Link href="/signup">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden py-20">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-3 h-3 rounded-full bg-secondary opacity-30" />
          <div className="absolute bottom-40 right-20 w-4 h-4 rounded-full bg-secondary opacity-30" />
          <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-secondary opacity-30" />
          <div className="absolute bottom-1/4 left-1/4 w-2.5 h-2.5 rounded-full bg-secondary opacity-30" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center z-10 space-y-8">
          <div className="inline-block bg-secondary/10 text-secondary border border-secondary/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            AI-powered exam practice
          </div>
          <h1 className="font-serif text-5xl md:text-7xl text-primary tracking-tight leading-tight">
            Turn your notes into a real personaised exam — instantly
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Paste your study material, choose your curriculum, and get a personalised practice exam with instant AI grading and detailed feedback.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-lg">
                Get started free
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="ghost" size="lg" className="h-14 px-8 text-lg text-primary hover:text-primary/80">
                See how it works
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-primary mb-4">Everything you need to ace it</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background border border-border rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-2xl text-primary mb-3">Any subject</h3>
              <p className="text-muted-foreground leading-relaxed">Works with any curriculum: IGCSE, A-Level, IB, AP, and more.</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-2xl text-primary mb-3">Instant grading</h3>
              <p className="text-muted-foreground leading-relaxed">Multiple Choice and short answer questions graded immediately by AI.</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-2xl text-primary mb-3">Tracks your progress</h3>
              <p className="text-muted-foreground leading-relaxed">Full history of every exam with scores and detailed review.</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif text-2xl text-primary mb-3">AI-powered feedback</h3>
              <p className="text-muted-foreground leading-relaxed">Ask your AI tutor to explain any answer in depth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl text-primary">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="relative flex flex-col items-center">
              <span className="absolute -top-10 font-serif text-8xl text-secondary/20 z-0">1</span>
              <div className="w-16 h-16 bg-card border border-border rounded-full flex items-center justify-center mb-6 z-10 shadow-sm text-primary">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-2xl text-primary mb-3 z-10">Paste your notes</h3>
              <p className="text-muted-foreground z-10">Drop in your class notes, textbook chapters, or just a topic name.</p>
            </div>
            <div className="relative flex flex-col items-center">
              <span className="absolute -top-10 font-serif text-8xl text-secondary/20 z-0">2</span>
              <div className="w-16 h-16 bg-card border border-border rounded-full flex items-center justify-center mb-6 z-10 shadow-sm text-primary">
                <Wand2 className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-2xl text-primary mb-3 z-10">Generate your exam</h3>
              <p className="text-muted-foreground z-10">Select your difficulty and question types, then let AI build a bespoke paper.</p>
            </div>
            <div className="relative flex flex-col items-center">
              <span className="absolute -top-10 font-serif text-8xl text-secondary/20 z-0">3</span>
              <div className="w-16 h-16 bg-card border border-border rounded-full flex items-center justify-center mb-6 z-10 shadow-sm text-primary">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-2xl text-primary mb-3 z-10">Get graded instantly</h3>
              <p className="text-muted-foreground z-10">Submit your answers to receive a score and detailed, constructive feedback.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-serif text-xl text-primary">Paperset</span>
            <span className="ml-2 hidden sm:inline-block">— Your dedicated study companion.</span>
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} Paperset. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
