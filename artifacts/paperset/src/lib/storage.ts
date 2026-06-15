export interface UserProfile {
  name: string;
  curriculum: string;
  year: string;
}

export interface Question {
  type: "mcq" | "short";
  question: string;
  choices: string[] | null;
  answer: string;
  explanation: string;
}

export interface ExamHistoryItem {
  id: string;
  topic: string;
  score: number;
  totalQuestions: number;
  date: string;
  questions: Question[];
}

export interface CurrentExamData {
  questions: Question[];
  topic: string;
  profile: UserProfile;
}

export interface AnswerState {
  questionIndex: number;
  isCorrect: boolean;
  score: number;
  userAnswer: string;
  feedback?: string;
  verdict?: "correct" | "partial" | "wrong";
}

export const storage = {
  getProfile: (): UserProfile | null => {
    try {
      const data = localStorage.getItem("paperset_userProfile");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setProfile: (profile: UserProfile) => {
    try {
      localStorage.setItem("paperset_userProfile", JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to save profile", e);
    }
  },
  
  getHistory: (): ExamHistoryItem[] => {
    try {
      const data = localStorage.getItem("paperset_examHistory");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  addHistory: (item: ExamHistoryItem) => {
    try {
      const history = storage.getHistory();
      const newHistory = [item, ...history].slice(0, 50);
      localStorage.setItem("paperset_examHistory", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  },
  removeHistoryItem: (id: string) => {
    try {
      const history = storage.getHistory();
      const newHistory = history.filter(item => item.id !== id);
      localStorage.setItem("paperset_examHistory", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to remove history item", e);
    }
  },
  clearHistory: () => {
    try {
      localStorage.removeItem("paperset_examHistory");
    } catch (e) {
      console.error("Failed to clear history", e);
    }
  },

  getCurrentExam: (): CurrentExamData | null => {
    try {
      const data = localStorage.getItem("paperset_currentExamData");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setCurrentExam: (exam: CurrentExamData) => {
    try {
      localStorage.setItem("paperset_currentExamData", JSON.stringify(exam));
    } catch (e) {
      console.error("Failed to save current exam", e);
    }
  },

  getCurrentAnswers: (): AnswerState[] => {
    try {
      const data = localStorage.getItem("paperset_currentExamAnswers");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setCurrentAnswers: (answers: AnswerState[]) => {
    try {
      localStorage.setItem("paperset_currentExamAnswers", JSON.stringify(answers));
    } catch (e) {
      console.error("Failed to save current answers", e);
    }
  },

  getRetryTopic: (): string => {
    try {
      return localStorage.getItem("paperset_retryTopic") || "";
    } catch {
      return "";
    }
  },
  setRetryTopic: (topic: string) => {
    try {
      localStorage.setItem("paperset_retryTopic", topic);
    } catch (e) {
      console.error("Failed to save retry topic", e);
    }
  }
};
