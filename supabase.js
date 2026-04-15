import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const rememberKey = "quix-remember-session";

const hasValidSupabaseUrl =
  typeof supabaseUrl === "string" && /^https?:\/\//.test(supabaseUrl);
const hasValidSupabaseAnonKey =
  typeof supabaseAnonKey === "string" &&
  supabaseAnonKey.length > 0 &&
  supabaseAnonKey !== "your-supabase-anon-key";

function getStorageForRememberChoice() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage.getItem(rememberKey) === "false"
    ? window.sessionStorage
    : window.localStorage;
}

const authStorage = {
  getItem(key) {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  },
  setItem(key, value) {
    if (typeof window === "undefined") {
      return;
    }

    const activeStorage = getStorageForRememberChoice();
    const otherStorage =
      activeStorage === window.localStorage ? window.sessionStorage : window.localStorage;

    activeStorage.setItem(key, value);
    otherStorage.removeItem(key);
  },
  removeItem(key) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
};

export function setRememberSession(remember) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(rememberKey, remember ? "true" : "false");
}

export function getRememberSession() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(rememberKey) !== "false";
}

export const supabase =
  hasValidSupabaseUrl && hasValidSupabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: authStorage
        }
      })
    : null;
