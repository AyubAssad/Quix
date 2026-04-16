import AppShell from "@/components/AppShell";
import QuizClient from "@/components/QuizClient";

export default function PastPaperPage({ params }) {
  return (
    <AppShell>
      <div className="card" style={{ marginBottom: 20 }}>
        <h1 className="section-title">Past paper</h1>
        <p className="muted">Work through the paper one question at a time and check each answer as you go.</p>
      </div>
      <QuizClient contentKind="past_paper" lectureId={params.id} lectureTitle="this past paper" />
    </AppShell>
  );
}
