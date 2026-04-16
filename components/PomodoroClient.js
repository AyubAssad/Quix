"use client";

import { useEffect, useMemo, useState } from "react";

const MODES = {
  focus: { label: "Focus", minutes: 25 },
  short_break: { label: "Short break", minutes: 5 },
  long_break: { label: "Long break", minutes: 15 }
};

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export default function PomodoroClient() {
  const [mode, setMode] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const [backgroundMode, setBackgroundMode] = useState("animated");

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRunning(false);

          if (mode === "focus") {
            setCompletedFocusSessions((count) => count + 1);
          }

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [mode, running]);

  const progress = useMemo(() => {
    const total = MODES[mode].minutes * 60;
    return ((total - secondsLeft) / total) * 100;
  }, [mode, secondsLeft]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setSecondsLeft(MODES[nextMode].minutes * 60);
    setRunning(false);
  }

  function resetTimer() {
    setSecondsLeft(MODES[mode].minutes * 60);
    setRunning(false);
  }

  return (
    <section className={`pomodoro-shell pomodoro-${backgroundMode}`}>
      <div className="pomodoro-backdrop" />
      <div className="card pomodoro-panel">
        <div className="action-row">
          <div>
            <p className="eyebrow">Pomodoro space</p>
            <h1 className="section-title">Stay focused, then recharge.</h1>
          </div>
          <div className="nav-links">
            <button
              className={`button ${backgroundMode === "animated" ? "" : "secondary"}`}
              onClick={() => setBackgroundMode("animated")}
              type="button"
            >
              Animated premium
            </button>
            <button
              className={`button ${backgroundMode === "academic" ? "" : "secondary"}`}
              onClick={() => setBackgroundMode("academic")}
              type="button"
            >
              Academic
            </button>
          </div>
        </div>

        <div className="pomodoro-grid">
          <div className="panel stack">
            <div className="nav-links">
              {Object.entries(MODES).map(([key, value]) => (
                <button
                  className={`button ${mode === key ? "" : "secondary"}`}
                  key={key}
                  onClick={() => switchMode(key)}
                  type="button"
                >
                  {value.label}
                </button>
              ))}
            </div>

            <div className="pomodoro-timer">{formatTime(secondsLeft)}</div>
            <div className="pomodoro-progress">
              <span style={{ width: `${Math.max(progress, 4)}%` }} />
            </div>

            <div className="quiz-nav">
              <button className="button" onClick={() => setRunning(true)} type="button">
                Start
              </button>
              <button className="button secondary" onClick={() => setRunning(false)} type="button">
                Pause
              </button>
              <button className="button secondary" onClick={resetTimer} type="button">
                Reset
              </button>
            </div>
          </div>

          <div className="panel stack">
            <h2 className="section-title">Session stats</h2>
            <div className="pomodoro-stat">
              <strong>{MODES[mode].label}</strong>
              <p className="muted">Current mode</p>
            </div>
            <div className="pomodoro-stat">
              <strong>{completedFocusSessions}</strong>
              <p className="muted">Focus sessions finished today</p>
            </div>
            <div className="pomodoro-stat">
              <strong>{running ? "Running" : "Paused"}</strong>
              <p className="muted">Timer status</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
