import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasValidSupabaseUrl =
  typeof supabaseUrl === "string" && /^https?:\/\//.test(supabaseUrl);
const hasValidSupabaseAnonKey =
  typeof supabaseAnonKey === "string" &&
  supabaseAnonKey.length > 0 &&
  supabaseAnonKey !== "your-supabase-anon-key";

export const supabase =
  hasValidSupabaseUrl && hasValidSupabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
