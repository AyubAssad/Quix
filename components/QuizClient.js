"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function QuizClient({ lectureId, lectureTitle }) {
  const [user, setUser] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkedAnswers, setCheckedAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [reportsByQuestion, setReportsByQuestion] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPage();
  }, [lectureId]);

  useEffect(() => {
    const currentQuestion = questions[currentIndex];
    const savedAnswer = currentQuestion ? checkedAnswers[currentQuestion.id]?.selected_option : "";
    setSelectedOption(savedAnswer ?? "");
    setReportMessage("");
    setReportStatus("");
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

    setAllQuestions(data ?? []);
    setQuestions(data ?? []);
    if (currentUser) {
      const { data: reportData } = await supabase
        .from("question_reports")
        .select("id, question_id, message, admin_reply, answered_at")
        .eq("lecture_id", lectureId)
        .eq("user_id", currentUser.id);

      setReportsByQuestion(
        Object.fromEntries((reportData ?? []).map((report) => [report.question_id, report]))
      );
    } else {
      setReportsByQuestion({});
    }
    setCurrentIndex(0);
    setCheckedAnswers({});
    setSelectedOption("");
    setLoading(false);
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? checkedAnswers[currentQuestion.id] : null;
  const currentReport = currentQuestion ? reportsByQuestion[currentQuestion.id] : null;
  const incorrectQuestions = useMemo(() => {
    return questions.filter((question) => checkedAnswers[question.id] && !checkedAnswers[question.id].is_correct);
  }, [checkedAnswers, questions]);
  const finishedQuiz =
    questions.length > 0 &&
    currentIndex === questions.length - 1 &&
    Boolean(currentAnswer);
  const totalEarned = useMemo(() => {
    return Object.values(checkedAnswers).reduce(
      (sum, item) => sum + (item?.points_awarded ?? 0),
      0
    );
  }, [checkedAnswers]);

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

  function goToNextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((current) => current + 1);
      setStatus("");
    }
  }

  function goToPreviousQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex((current) => current - 1);
      setStatus("");
    }
  }

  function repeatIncorrectQuestions() {
    if (incorrectQuestions.length === 0) {
      return;
    }

    setQuestions(incorrectQuestions);
    setCheckedAnswers({});
    setCurrentIndex(0);
    setSelectedOption("");
    setStatus("");
  }

  function restartFullQuiz() {
    setQuestions(allQuestions);
    setCheckedAnswers({});
    setCurrentIndex(0);
    setSelectedOption("");
    setStatus("");
  }

  async function submitReport() {
    if (!supabase) {
      setReportStatus("Add your Supabase URL and anon key in .env.local first.");
      return;
    }

    if (!user) {
      setReportStatus("Please login first to send a report.");
      return;
    }

    if (!currentQuestion) {
      return;
    }

    const trimmedMessage = reportMessage.trim();
    if (!trimmedMessage) {
      setReportStatus("Please write your message first.");
      return;
    }

    const { error } = await supabase.from("question_reports").upsert(
      {
        user_id: user.id,
        lecture_id: lectureId,
        question_id: currentQuestion.id,
        message: trimmedMessage
      },
      { onConflict: "user_id,question_id" }
    );

    if (error) {
      setReportStatus(error.message);
      return;
    }

    setReportStatus("Your report was sent.");
    setReportsByQuestion((current) => ({
      ...current,
      [currentQuestion.id]: {
        ...(current[currentQuestion.id] || {}),
        question_id: currentQuestion.id,
        message: trimmedMessage,
        admin_reply: current[currentQuestion.id]?.admin_reply || null,
        answered_at: current[currentQuestion.id]?.answered_at || null
      }
    }));
    setReportMessage("");
  }

  if (loading) {
    return <div className="panel">Loading quiz...</div>;
  }

  if (!currentQuestion) {
    return <div className="panel">No questions found for this lecture yet.</div>;
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
              {lectureTitle} <span className="pill">Question {currentIndex + 1} of {questions.length}</span>
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
                    <span>{label}</span>
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

          <div className="report-box">
            <label className="field">
              <span>Report this question</span>
              <textarea
                onChange={(event) => setReportMessage(event.target.value)}
                placeholder="Send a note if this question has a mistake or needs review."
                rows="3"
                value={reportMessage}
              />
            </label>
            <button className="button secondary" onClick={submitReport} type="button">
              Send report
            </button>
            {reportStatus && <div className="message">{reportStatus}</div>}
            {currentReport?.message && (
              <div className="message">
                Your last report: {currentReport.message}
              </div>
            )}
            {currentReport?.admin_reply && (
              <div className="message message-success">
                Admin reply: {currentReport.admin_reply}
              </div>
            )}
          </div>
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
            disabled={!currentAnswer || currentIndex === questions.length - 1}
            onClick={goToNextQuestion}
            type="button"
          >
            Next question
          </button>
        </div>

        {finishedQuiz && (
          <div className="stack">
            <div className="message">
              Quiz complete for {lectureTitle}. You earned {totalEarned} points.
            </div>
            <div className="quiz-nav">
              <button
                className="button secondary"
                disabled={incorrectQuestions.length === 0}
                onClick={repeatIncorrectQuestions}
                type="button"
              >
                Repeat incorrect questions
              </button>
              <a className="button" href="/home">
                Return to home
              </a>
            </div>
            {questions.length !== allQuestions.length && (
              <button className="button secondary" onClick={restartFullQuiz} type="button">
                Restart full quiz
              </button>
            )}
          </div>
        )}

        {status && !currentAnswer && <div className="message">{status}</div>}
      </div>
    </div>
  );
}
