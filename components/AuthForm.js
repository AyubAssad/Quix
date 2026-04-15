"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import { getRememberSession, setRememberSession, supabase } from "@/lib/supabase";

export default function AuthForm({ mode = "login" }) {
  const isLogin = mode === "login";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    setRememberMe(getRememberSession());
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (!supabase) {
      setLoading(false);
      setMessage("Add your Supabase URL and anon key in .env.local first.");
      return;
    }

    if (isLogin) {
      setRememberSession(rememberMe);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);

      if (error) {
        setMessage(error.message);
        return;
      }

      window.location.href = "/home";
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created. You can now login and continue to your home page.");
  }

  async function handleGoogleSignIn() {
    setMessage("");

    if (!supabase) {
      setMessage("Add your Supabase URL and anon key in .env.local first.");
      return;
    }

    setRememberSession(rememberMe);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/home`
      }
    });

    if (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="auth-shell">
      <div className="card auth-side">
        <div className="brand">
          <span className="brand-mark">Q</span>
          <span>Quix</span>
        </div>
        <div className="stack">
          <p className="eyebrow">Master your subjects through play</p>
          <h1 className="title" style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)" }}>
            {isLogin ? "Sign in and keep learning." : "Create your Quix account."}
          </h1>
          <p className="subtitle">
            {isLogin
              ? "Continue your lecture journey, answer quizzes, and keep moving up the leaderboard."
              : "Join your classmates, open your lectures, and start collecting points one quiz at a time."}
          </p>
        </div>
      </div>

      <div className="card auth-box">
        <div className="stack">
          <div className="brand" style={{ justifyContent: "center", fontSize: "1.4rem" }}>
            <span className="brand-mark">Q</span>
            <span>Quix</span>
          </div>
          <div className="auth-tabs">
            <Link className={isLogin ? "auth-tab active" : "auth-tab"} href="/login">
              Sign In
            </Link>
            <Link className={!isLogin ? "auth-tab active" : "auth-tab"} href="/signup">
              Sign Up
            </Link>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            {!isLogin && (
              <label className="field">
                <span>Full name</span>
                <div className="input-wrap">
                  <UserRound size={18} />
                  <input
                    required
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Student name"
                  />
                </div>
              </label>
            )}

            <label className="field">
              <span>Email Address</span>
              <div className="input-wrap">
                <Mail size={18} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="student@example.com"
                />
              </div>
            </label>

            <label className="field">
              <span>Password</span>
              <div className="input-wrap">
                <LockKeyhole size={18} />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
            </label>

            {isLogin && (
              <label className="remember-row">
                <input
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  type="checkbox"
                />
                <span>Keep me signed in</span>
              </label>
            )}

            {message && <div className="message">{message}</div>}

            <button className="button" disabled={loading} type="submit">
              {loading ? "Please wait..." : isLogin ? "Start learning" : "Create account"}
            </button>
          </form>

          <div className="oauth-divider">
            <span />
            <span>OR</span>
            <span />
          </div>

          <button className="button secondary oauth-button" onClick={handleGoogleSignIn} type="button">
            <span className="oauth-mark">G</span>
            Continue with Google
          </button>

          <p className="muted">
            {isLogin ? "New to Quix? " : "Already have an account? "}
            <Link href={isLogin ? "/signup" : "/login"} style={{ color: "var(--accent)" }}>
              {isLogin ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
