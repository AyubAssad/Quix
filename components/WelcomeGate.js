"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function WelcomeGate({ children }) {
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkUser() {
      if (!supabase) {
        if (active) {
          setChecking(false);
        }
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (user) {
        setIsLoggedIn(true);
        window.location.href = "/home";
        return;
      }

      setChecking(false);
    }

    checkUser();

    return () => {
      active = false;
    };
  }, []);

  if (checking || isLoggedIn) {
    return null;
  }

  return children;
}
