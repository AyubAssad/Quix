"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthGate({ children }) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkUser() {
      if (!supabase) {
        if (active) {
          window.location.href = "/login";
        }
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setChecking(false);
    }

    checkUser();

    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return <div className="panel">Checking your session...</div>;
  }

  return children;
}
