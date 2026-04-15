"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Home, LayoutGrid, LogIn, LogOut, Shield, Trophy, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AppShell({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      const currentUser = data.user ?? null;
      setUser(currentUser);
      setIsAdmin(currentUser?.email === adminEmail);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(currentUser?.email === adminEmail);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="page-shell">
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="brand-mark">Q</span>
          <span>Quix</span>
        </Link>

        <div className="nav-links">
          {!user && (
            <Link className="button secondary" href="/">
              <LayoutGrid size={16} />
              Welcome
            </Link>
          )}
          <Link className="button secondary" href="/home">
            <Home size={16} />
            Home
          </Link>
          <Link className="button secondary" href="/leaderboard">
            <Trophy size={16} />
            Leaderboard
          </Link>
          {!user && (
            <>
              <Link className="button secondary" href="/login">
                <LogIn size={16} />
                Login
              </Link>
              <Link className="button" href="/signup">
                <UserPlus size={16} />
                Sign up
              </Link>
            </>
          )}
          {user && isAdmin && (
            <Link className="button secondary" href="/admin">
              <Shield size={16} />
              Admin
            </Link>
          )}
          {user && (
            <button className="button" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>
      </nav>

      {children}
    </div>
  );
}
