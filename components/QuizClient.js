"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function QuizClient({ lectureId, lectureTitle }) {
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPage();
  }, [lectureId]);

  async function loadPage() {
    if (!supabase) {
      setStatus("Add your Supabase URL and anon key in .env.local first.");
      setLoading(false);
      return;
    }

    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();

    setUser(currentUser ?? null);

    const { data, error } = await supabase
      .from("questions")
      .select("id, question_type, question_text, option_a, option_b, option_c, option_d, points")
      .eq("lecture_id", lectureId)
      .order("created_at", { ascending: true });

    if (!error) {
      setQuestions(data ?? []);
    }

    setLoading(false);
  }

  async function submitQuiz() {
    if (!supabase) {
      setStatus("Add your Supabase URL and anon key in .env.local first.");
      return;
    }

    if (!user) {
      setStatus("Please login first.");
      return;
    }

    if (questions.length === 0) {
      setStatus("No questions found for this lecture.");
      return;
    }

    const unanswered = questions.some((question) => !answers[question.id]);
    if (unanswered) {
      setStatus("Please answer every question.");
      return;
    }

    setStatus("Checking answers...");

    const { data: fullQuestions, error: questionError } = await supabase
      .from("questions")
      .select("id, correct_option, points")
      .eq("lecture_id", lectureId);

    if (questionError) {
      setStatus(questionError.message);
      return;
    }

    const submissions = fullQuestions.map((question) => {
      const selected = answers[question.id];
      const isCorrect = selected === question.correct_option;

      return {
        lecture_id: lectureId,
        question_id: question.id,
        user_id: user.id,
        selected_option: selected,
        is_correct: isCorrect,
        points_awarded: isCorrect ? question.points : 0
      };
    });

    const { error: submissionError } = await supabase
      .from("submissions")
      .upsert(submissions, { onConflict: "user_id,question_id" });

    if (submissionError) {
      setStatus(submissionError.message);
      return;
    }

    const earned = submissions.reduce((sum, item) => sum + item.points_awarded, 0);

    const { error: rpcError } = await supabase.rpc("recalculate_user_points", {
      target_user_id: user.id
    });

    if (rpcError) {
      setStatus(rpcError.message);
      return;
    }

    setStatus(`Quiz submitted for ${lectureTitle}. You earned ${earned} points.`);
  }

  if (loading) {
    return <div className="panel">Loading quiz...</div>;
  }

  return (
    <div className="stack">
      {!user && (
        <div className="message">
          Login first so your points can be saved to the leaderboard.
        </div>
      )}

      {questions.map((question, index) => (
        <div className="card" key={question.id}>
          <h3>
            Question {index + 1} <span className="pill">{question.points} points</span>
          </h3>
          <p>{question.question_text}</p>

          <div className="list">
            {[
              ["a", question.option_a],
              ["b", question.option_b],
              ["c", question.option_c],
              ["d", question.option_d]
            ]
              .filter(([, label]) => Boolean(label))
              .map(([value, label]) => (
              <label className="quiz-option" key={value}>
                <input
                  checked={answers[question.id] === value}
                  name={`question-${question.id}`}
                  onChange={() =>
                    setAnswers((current) => ({ ...current, [question.id]: value }))
                  }
                  type="radio"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {status && <div className="message">{status}</div>}

      <button className="button" onClick={submitQuiz}>
        Submit quiz
      </button>
    </div>
  );
}
