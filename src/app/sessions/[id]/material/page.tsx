import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/store";
import { CoachShell } from "@/features/CoachShell";
import { ReadingMaterial } from "./ReadingMaterial";
export const metadata: Metadata = { title: "What I'm studying" };
export default function MaterialPage({ params }: PageProps<"/sessions/[id]/material">) {
  return <Suspense fallback={<CoachShell><p>Reading notes…</p></CoachShell>}>{params.then(({ id }) => <Material id={id} />)}</Suspense>;
}
async function Material({ id }: { id: string }) {
  const session = await getSession(id);
  if (!session) notFound();
  const ready = session.material.status === "ready";
  return <CoachShell back="/sessions/new">
    <h1 className="coach-title">What are we learning from?</h1><p className="coach-intro">Add notes from a podcast episode.</p>
    <Link className="coach-drop" href="/sessions/new"><p className="font-semibold">Drop episode notes</p><small>PDF, text or a photo</small></Link>
    <div className="coach-card coach-added"><p className="coach-label">Added</p><p className="coach-value">{session.material.title || "Episode notes"}</p></div>
    {!ready ? <div className="mt-4"><ReadingMaterial sessionId={id} status={session.material.status} error={session.material.error} /></div> : <>
      <details className="coach-details"><summary>What we&apos;ll practice · about 7 minutes</summary><p className="mt-3">{session.material.summary}</p><ol>{session.material.key_ideas.map(idea => <li key={idea.id}><strong>{idea.title}</strong><p>{idea.explanation}</p></li>)}</ol></details>
      <div className="coach-footer"><Link className="coach-button" data-step="start-practice" href={`/sessions/${id}/practice`}>Next</Link></div>
    </>}
  </CoachShell>;
}
