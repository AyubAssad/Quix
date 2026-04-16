import AppShell from "@/components/AppShell";
import QuizResultsClient from "@/components/QuizResultsClient";

export default function ResultsPage({ params, searchParams }) {
  return (
    <AppShell>
      <QuizResultsClient
        contentKind={searchParams.kind === "past_paper" ? "past_paper" : "lecture"}
        lectureId={params.id}
      />
    </AppShell>
  );
}
