import AppShell from "@/components/AppShell";
import AuthGate from "@/components/AuthGate";
import LectureList from "@/components/LectureList";
import { GraduationCap } from "lucide-react";

export default function StudentHomePage() {
  return (
    <AppShell>
      <AuthGate>
        <section className="stack">
          <div className="card quote-card">
            <p className="eyebrow">
              <GraduationCap size={16} />
              Start strong
            </p>
            <h2 className="section-title">First step to acing your exams starts here.</h2>
            <p className="muted">
              Move between quizzes and past paper, stay consistent, and let each session build your confidence one step at a time.
            </p>
          </div>

          <LectureList />
        </section>
      </AuthGate>
    </AppShell>
  );
}
