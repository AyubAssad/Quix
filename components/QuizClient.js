"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function cleanOptionLabel(label) {
  if (!label) {
    return "";
  }

  return label.replace(/^[A-D][\.\):\-\s]+/i, "").trim();
}

function getResultStorageKey(contentKind, lectureId) {
  return `quix-result:${contentKind}:${lectureId}`;
}

function getRetryStorageKey(contentKind, lectureId) {
  return `quix-retry:${contentKind}:${lectureId}`;
}

export default function QuizClient({ lectureId, lectureTitle, contentKind = "lecture" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [resolvedTitle, setResolvedTitle] = useState(lectureTitle);
  const [allQuestions, setAllQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkedAnswers, setCheckedAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const retryMode = searchParams.get("retry") === "incorrect";

  useEffect(() => {
    loadPage();
  }, [lectureId, retryMode]);

  useEffect(() => {
    const currentQuestion = questions[currentIndex];
    const savedAnswer = currentQuestion ? checkedAnswers[currentQuestion.id]?.selected_option : "";
    setSelectedOption(savedAnswer ?? "");
  }, [checkedAnswers, currentIndex, questions]);

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

    const { data: lectureData } = await supabase
      .from("lectures")
      .select("title")
      .eq("id", lectureId)
      .maybeSingle();

    setResolvedTitle(lectureData?.title || lectureTitle);

    const { data, error } = await supabase
      .from("questions")
      .select(
        "id, question_type, question_text, option_a, option_b, option_c, option_d, points, correct_option"
      )
      .eq("lecture_id", lectureId)
      .order("created_at", { ascending: true });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    const fetchedQuestions = data ?? [];
    let visibleQuestions = fetchedQuestions;

    if (retryMode && typeof window !== "undefined") {
      const retryIds = JSON.parse(
        window.sessionStorage.getItem(getRetryStorageKey(contentKind, lectureId)) || "[]"
      );

      if (Array.isArray(retryIds) && retryIds.length > 0) {
        visibleQuestions = fetchedQuestions.filter((question) => retryIds.includes(question.id));
      }
    }

    setAllQuestions(fetchedQuestions);
    setQuestions(visibleQuestions);
    setCurrentIndex(0);
    setCheckedAnswers({});
    setSelectedOption("");
    setStatus("");
    setLoading(false);
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? checkedAnswers[currentQuestion.id] : null;
  const incorrectQuestions = useMemo(() => {
    return questions.filter(
      (question) => checkedAnswers[question.id] && !checkedAnswers[question.id].is_correct
    );
  }, [checkedAnswers, questions]);
  const totalEarned = useMemo(() => {
    return Object.values(checkedAnswers).reduce(
      (sum, item) => sum + (item?.points_awarded ?? 0),
      0
    );
  }, [checkedAnswers]);
  const isLastQuestion = currentIndex === questions.length - 1;

  async function checkAnswer() {
    if (!supabase) {
      setStatus("Add your Supabase URL and anon key in .env.local first.");
      return;
    }

    if (!user) {
      setStatus("Please login first.");
      return;
    }

    if (!currentQuestion) {
      return;
    }

    if (!selectedOption) {
      setStatus("Please choose an answer first.");
      return;
    }

    setSaving(true);
    setStatus("");

    const isCorrect = selectedOption === currentQuestion.correct_option;
    const submission = {
      lecture_id: lectureId,
      question_id: currentQuestion.id,
      user_id: user.id,
      selected_option: selectedOption,
      is_correct: isCorrect,
      points_awarded: isCorrect ? currentQuestion.points : 0
    };

    const { error: submissionError } = await supabase
      .from("submissions")
      .upsert(submission, { onConflict: "user_id,question_id" });

    if (submissionError) {
      setStatus(submissionError.message);
      setSaving(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc("recalculate_user_points", {
      target_user_id: user.id
    });

    if (rpcError) {
      setStatus(rpcError.message);
      setSaving(false);
      return;
    }

    setCheckedAnswers((current) => ({
      ...current,
      [currentQuestion.id]: submission
    }));

    setStatus(
      isCorrect
        ? "Correct answer. Great job."
        : `Wrong answer. The correct answer was ${
            currentQuestion.correct_option.toUpperCase()
          }.`
    );
    setSaving(false);
  }

  function goToPreviousQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex((current) => current - 1);
      setStatus("");
    }
  }

  function finalizeQuiz() {
    if (typeof window === "undefined") {
      return;
    }

    const resultPayload = {
      lectureId,
      lectureTitle: resolvedTitle,
      contentKind,
      totalQuestions: questions.length,
      correctCount: questions.length - incorrectQuestions.length,
      incorrectCount: incorrectQuestions.length,
      totalEarned,
      incorrectQuestionIds: incorrectQuestions.map((question) => question.id),
      retryMode
    };

    window.sessionStorage.setItem(
      getResultStorageKey(contentKind, lectureId),
      JSON.stringify(resultPayload)
    );
    router.push(`/results/${lectureId}?kind=${contentKind}`);
  }

  function goToNextQuestion() {
    if (isLastQuestion) {
      finalizeQuiz();
      return;
    }

    setCurrentIndex((current) => current + 1);
    setStatus("");
  }

  if (loading) {
    return <div className="panel">Loading quiz...</div>;
  }

  if (!currentQuestion) {
    return (
      <div className="panel">
        {retryMode
          ? "No incorrect questions were found to repeat."
          : "No questions found for this content yet."}
      </div>
    );
  }

  return (
    <div className="stack">
      {!user && (
        <div className="message">
          Login first so your points can be saved to the leaderboard.
        </div>
      )}

      <div className="card stack">
        <div className="quiz-header">
          <div>
            <h3>
              {resolvedTitle} <span className="pill">Question {currentIndex + 1} of {questions.length}</span>
            </h3>
            <p className="muted">Each question is worth 1 point.</p>
          </div>
          <div className="pill">Points earned: {totalEarned}</div>
        </div>

        <div className="panel stack">
          <h3>{currentQuestion.question_text}</h3>

          <div className="list">
            {[
              ["a", currentQuestion.option_a],
              ["b", currentQuestion.option_b],
              ["c", currentQuestion.option_c],
              ["d", currentQuestion.option_d]
            ]
              .filter(([, label]) => Boolean(label))
              .map(([value, label]) => {
                const isChecked = selectedOption === value;
                const isLocked = Boolean(currentAnswer);
                const isCorrectOption = currentAnswer && currentQuestion.correct_option === value;
                const isWrongSelection =
                  currentAnswer &&
                  currentAnswer.selected_option === value &&
                  currentAnswer.selected_option !== currentQuestion.correct_option;

                return (
                  <label
                    className={`quiz-option ${
                      isChecked ? "quiz-option-selected" : ""
                    } ${isCorrectOption ? "quiz-option-correct" : ""} ${
                      isWrongSelection ? "quiz-option-wrong" : ""
                    }`}
                    key={value}
                  >
                    <input
                      checked={isChecked}
                      disabled={isLocked}
                      name={`question-${currentQuestion.id}`}
                      onChange={() => setSelectedOption(value)}
                      type="radio"
                    />
                    <span>{cleanOptionLabel(label)}</span>
                  </label>
                );
              })}
          </div>

          {currentAnswer ? (
            <div className={`message ${currentAnswer.is_correct ? "message-success" : "message-error"}`}>
              {currentAnswer.is_correct
                ? "Correct answer. You got the point."
                : `Wrong answer. Correct answer: ${currentQuestion.correct_option.toUpperCase()}.`}
            </div>
          ) : (
            <button className="button" disabled={saving || !selectedOption} onClick={checkAnswer} type="button">
              {saving ? "Checking..." : "Check answer"}
            </button>
          )}
        </div>

        <div className="quiz-nav">
          <button
            className="button secondary"
            disabled={currentIndex === 0}
            onClick={goToPreviousQuestion}
            type="button"
          >
            Previous
          </button>
          <button
            className="button"
            disabled={!currentAnswer}
            onClick={goToNextQuestion}
            type="button"
          >
            {isLastQuestion ? "End quiz" : "Next question"}
          </button>
        </div>

        {status && !currentAnswer && <div className="message">{status}</div>}
      </div>
    </div>
  );
}
