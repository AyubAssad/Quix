"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Leaderboard() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, total_points")
      .order("total_points", { ascending: false })
      .limit(20);

    if (!error) {
      setProfiles(data ?? []);
    }

    setLoading(false);
  }

  if (loading) {
    return <div className="panel">Loading leaderboard...</div>;
  }

  return (
    <div className="card">
      <h1 className="section-title">Top students</h1>
      <div className="list">
        {profiles.map((profile, index) => (
          <div className="leader-row" key={profile.id}>
            <div>
              <strong>
                #{index + 1} {profile.full_name || profile.email}
              </strong>
              <div className="muted">{profile.email}</div>
            </div>
            <strong>{profile.total_points || 0} pts</strong>
          </div>
        ))}
        {profiles.length === 0 && (
          <p className="muted">
            {!supabase
              ? "Add your Supabase keys in .env.local first."
              : "No students have points yet."}
          </p>
        )}
      </div>
    </div>
  );
}
