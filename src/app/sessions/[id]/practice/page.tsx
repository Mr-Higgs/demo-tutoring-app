import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/store";
import { CoachShell } from "@/features/CoachShell";
import { PracticeFlow } from "./PracticeFlow";
import { StartingPractice } from "./StartingPractice";
import { mission } from "@mission";
export const metadata: Metadata = { title: "Practice" };
export default function PracticePage({ params }: PageProps<"/sessions/[id]/practice">) {
  return <Suspense fallback={<CoachShell><p>Loading practice…</p></CoachShell>}>{params.then(({ id }) => <Practice id={id} />)}</Suspense>;
}
async function Practice({ id }: { id: string }) {
  const session = await getSession(id);
  if (!session) notFound();
  if (session.material.status !== "ready") redirect(`/sessions/${id}/material`);
  if (session.practice.status !== "ready") return <CoachShell back={`/sessions/${id}/material`}><h1 className="coach-title">Practice</h1><div className="mt-6"><StartingPractice sessionId={id} status={session.practice.status} error={session.practice.error} count={mission.practice.count} /></div></CoachShell>;
  return <PracticeFlow sessionId={id} questions={[...session.practice.questions].sort((a,b) => a.position - b.position)} answers={session.answers} />;
}
