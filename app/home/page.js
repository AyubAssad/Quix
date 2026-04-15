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
              Choose your stage, stay consistent, and let each quiz build your confidence one step at a time.
            </p>
          </div>

          <div className="card">
            <p className="eyebrow">
              <GraduationCap size={16} />
              Student home
            </p>
            <h1 className="section-title">Choose your stage</h1>
            <p className="muted">
              Start with a stage, open a block folder, then choose a module and lecture.
            </p>
          </div>
          <LectureList />
        </section>
      </AuthGate>
    </AppShell>
  );
}
