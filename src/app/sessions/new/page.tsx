import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getProfile } from "@/lib/store";
import { CoachShell } from "@/features/CoachShell";
import { MaterialForm } from "./MaterialForm";
export const metadata: Metadata = { title: "What I'm studying" };
export default function NewSessionPage() { return <Suspense fallback={<CoachShell><p>Loading…</p></CoachShell>}><MaterialGate /></Suspense>; }
async function MaterialGate() {
  if (!await getProfile()) redirect("/onboard");
  return <CoachShell back="/onboard"><h1 className="coach-title">What are we learning from?</h1><p className="coach-intro">Add notes from a podcast episode.</p><MaterialForm /></CoachShell>;
}
