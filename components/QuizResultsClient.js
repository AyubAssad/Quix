"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Frown, ThumbsUp } from "lucide-react";

function getResultStorageKey(contentKind, lectureId) {
  return `quix-result:${contentKind}:${lectureId}`;
}

function getRetryStorageKey(contentKind, lectureId) {
  return `quix-retry:${contentKind}:${lectureId}`;
}

export default function QuizResultsClient({ lectureId, contentKind = "lecture" }) {
  const router = useRouter();
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.sessionStorage.getItem(
      getResultStorageKey(contentKind, lectureId)
    );

    if (saved) {
      setResult(JSON.parse(saved));
    }
  }, [contentKind, lectureId]);

  function repeatIncorrectQuestions() {
    if (!result || result.incorrectQuestionIds.length === 0 || typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      getRetryStorageKey(contentKind, lectureId),
      JSON.stringify(result.incorrectQuestionIds)
    );

    router.push(
      contentKind === "past_paper"
        ? `/past-papers/${lectureId}?retry=incorrect`
        : `/lectures/${lectureId}?retry=incorrect`
    );
  }

  const scorePercent =
    result && result.totalQuestions > 0
      ? Math.round((result.correctCount / result.totalQuestions) * 100)
      : 0;

  const performance = !result
    ? null
    : scorePercent >= 90
      ? {
          title: "Outstanding work",
          text: "You crushed this quiz. Keep that momentum going.",
          icon: <Award size={34} />,
          className: "result-badge result-badge-top"
        }
      : scorePercent >= 50
        ? {
            title: "Nice progress",
            text: "You are on the right track. A quick review will push this even higher.",
            icon: <ThumbsUp size={34} />,
            className: "result-badge result-badge-mid"
          }
        : {
            title: "Keep going",
            text: "This one was tough. Review the mistakes and try again stronger.",
            icon: <Frown size={34} />,
            className: "result-badge result-badge-low"
          };

  if (!result) {
    return <div className="panel">No recent result found for this quiz yet.</div>;
  }

  return (
    <div className="card stack">
      <h1 className="section-title">Quiz results</h1>
      <div className={performance.className}>
        <div className="result-badge-icon">{performance.icon}</div>
        <div>
          <strong>{result.lectureTitle}</strong>
          <p className="muted">{performance.title} · {scorePercent}%</p>
          <p className="muted">{performance.text}</p>
        </div>
      </div>
      <div className="grid">
        <div className="panel">
          <strong>{result.totalQuestions}</strong>
          <p className="muted">Questions answered.</p>
        </div>
        <div className="panel">
          <strong>{result.totalEarned} points</strong>
          <p className="muted">Total points earned.</p>
        </div>
        <div className="panel">
          <strong>{result.correctCount}</strong>
          <p className="muted">Correct answers.</p>
        </div>
        <div className="panel">
          <strong>{result.incorrectCount}</strong>
          <p className="muted">Incorrect answers.</p>
        </div>
      </div>

      <div className="quiz-nav">
        <button
          className="button secondary"
          disabled={result.incorrectQuestionIds.length === 0}
          onClick={repeatIncorrectQuestions}
          type="button"
        >
          Repeat incorrect questions
        </button>
        <button className="button" onClick={() => router.push("/home")} type="button">
          Return to home
        </button>
      </div>
    </div>
  );
}
