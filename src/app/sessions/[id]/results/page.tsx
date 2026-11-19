import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/store";
import { CoachShell } from "@/features/CoachShell";
import { EvaluatingAnswers } from "./EvaluatingAnswers";
export const metadata: Metadata = { title: "How did I do" };
export default function ResultsPage({ params }: PageProps<"/sessions/[id]/results">) {
  return <Suspense fallback={<CoachShell><p>Loading feedback…</p></CoachShell>}>{params.then(({ id }) => <Results id={id} />)}</Suspense>;
}
async function Results({ id }: { id: string }) {
  const session = await getSession(id);
  if (!session) notFound();
  if (session.practice.status !== "ready") redirect(`/sessions/${id}/practice`);
  if (session.results.status !== "ready") return <CoachShell back={`/sessions/${id}/practice`}><h1 className="coach-title">How did I do</h1><div className="mt-6"><EvaluatingAnswers sessionId={id} status={session.results.status} error={session.results.error} /></div></CoachShell>;
  const questions = [...session.practice.questions].sort((a,b) => a.position - b.position);
  const byId = new Map(session.results.items.map(item => [item.question_id, item]));
  const correct = session.results.items.filter(item => item.result === "right").length;
  const strong = correct >= 4;
  const sample = session.material.title === "Lenny's Podcast: prioritization";
  const problemFirstQuestion = questions.find(question => question.position === 2);
  const problemFirstCorrect = problemFirstQuestion && byId.get(problemFirstQuestion.id)?.result === "right";
  const missed = questions.find(question => byId.get(question.id)?.result !== "right");
  const focus = session.material.key_ideas.find(idea => idea.id === missed?.key_idea_id)?.title;
  return <CoachShell back={`/sessions/${id}/practice`}>
    <div data-step="results-summary"><h1 className="coach-title">{strong ? "Strong call." : "Keep practicing."}</h1>
    <p className="mt-2">{sample ? (problemFirstCorrect ? "Starting with the problem keeps the roadmap honest." : "Start with the problem before committing to a solution.") : (strong ? "You connected the notes to your next product decision." : "Revisit the source notes, then bring one takeaway into your next decision.")}</p>
    <div className="coach-card mt-6"><p className="coach-label">This session</p><p className="coach-score">{correct} of {questions.length}</p></div>
    <div className="coach-card mt-3"><p className="coach-label">Practice next</p><p className="coach-value">{sample ? "Saying no to stakeholders" : focus ?? "Apply one takeaway from every episode"}</p></div></div>
    <details className="coach-details"><summary>Review your answers</summary><div className="coach-review">{questions.map(question => {
      const result = byId.get(question.id);
      return <article className="coach-card" key={question.id}><h2 className="font-semibold">Scenario {question.position} · {result?.result === "right" ? "Right" : "Not yet"}</h2><p>{question.prompt}</p><p><strong>Your answer:</strong> {question.choices?.[session.answers[question.id]] ?? "No answer"}</p><p><strong>Best answer:</strong> {question.choices?.[question.answer] ?? question.answer}</p><p>{question.explanation}</p></article>;
    })}</div></details>
    <div className="coach-footer"><Link className="coach-button yellow" href="/onboard">Practice again</Link></div>
  </CoachShell>;
}
