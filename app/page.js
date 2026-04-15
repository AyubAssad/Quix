import AppShell from "@/components/AppShell";
import HeroVisual from "@/components/HeroVisual";
import WelcomeGate from "@/components/WelcomeGate";
import { BookOpenText, CircleHelp, Mail, Sparkles, Trophy } from "lucide-react";

export default function HomePage() {
  return (
    <AppShell>
      <WelcomeGate>
        <section className="hero">
          <div className="card welcome-card">
            <div className="welcome-grid">
              <p className="eyebrow">
                <Sparkles size={16} />
                Start learning today
              </p>
              <h1 className="title">
                <span className="title-accent">One Quiz</span> at a time. <br />
                Quix helps you dominate your exams.
              </h1>
              <p className="subtitle">
                Challenge yourself with targeted quizzes from your lectures, climb
                the leaderboard, and track your progress through every stage, block,
                and module.
              </p>
              <div className="hero-actions">
                <a className="button" href="/signup">
                  Start learning
                </a>
                <a className="button secondary" href="/leaderboard">
                  Leaderboard
                </a>
              </div>
            </div>

            <HeroVisual />
          </div>

          <div className="panel welcome-footer">
            <div>
              <h2 className="section-title" style={{ marginBottom: 8 }}>
                Why choose Quix?
              </h2>
              <p className="muted">
                Built for lecture-based learning, quick revision, and simple quiz
                management for both students and admins.
              </p>
            </div>

            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <BookOpenText size={22} />
                </div>
                <h3>Lectures</h3>
                <p className="muted">
                  Organize your content by stage, block, module, and lecture.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <CircleHelp size={22} />
                </div>
                <h3>Quick Play</h3>
                <p className="muted">
                  Solve MCQ and True/False questions with one click.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <Trophy size={22} />
                </div>
                <h3>Points</h3>
                <p className="muted">
                  Each correct answer adds to a live leaderboard of top students.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <Mail size={22} />
                </div>
                <h3>Contact</h3>
                <div className="muted contact-lines">
                  <p>
                    <strong>Email:</strong> ayoob.abdulqader@med.hmu.edu.krd
                  </p>
                  <p>
                    <strong>Phone:</strong> 07510054152
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </WelcomeGate>
    </AppShell>
  );
}
