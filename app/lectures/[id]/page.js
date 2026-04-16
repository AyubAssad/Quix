import AppShell from "@/components/AppShell";
import QuizClient from "@/components/QuizClient";

export default function LecturePage({ params }) {
  return (
    <AppShell>
      <div className="card" style={{ marginBottom: 20 }}>
        <h1 className="section-title">Lecture quiz</h1>
        <p className="muted">Answer all questions below and submit to get points.</p>
      </div>
      <QuizClient contentKind="lecture" lectureId={params.id} lectureTitle="this lecture" />
    </AppShell>
  );
}
