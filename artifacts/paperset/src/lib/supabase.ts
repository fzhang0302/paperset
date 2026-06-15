import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  name: string;
  curriculum: string;
  year: string;
};

export type ExamRecord = {
  id: string;
  user_id: string;
  topic: string;
  score_pct: number;
  total_questions: number;
  correct_answers: number;
  questions: unknown;
  created_at: string;
};
