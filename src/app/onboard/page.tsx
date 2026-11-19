import type { Metadata } from "next";
import { Suspense } from "react";
import { mission } from "@mission";
import { getProfile } from "@/lib/store";
import { CoachShell } from "@/features/CoachShell";
import { saveOnboarding } from "./actions";
export const metadata: Metadata = { title: "Get to know me" };
export default function OnboardPage() {
  return <CoachShell><h1 className="coach-title">Hi Mia. Let&apos;s set you up.</h1><p className="coach-intro">Tell me where you are as a PM.</p><Suspense fallback={<p>Loading…</p>}><OnboardForm /></Suspense></CoachShell>;
}
async function OnboardForm() {
  const profile = await getProfile();
  return <form action={saveOnboarding} className="coach-form">
    <input type="hidden" name="name" value={mission.learner.name} />
    <input type="hidden" name="topic" value={mission.topic} />
    <div className="coach-stack">
      <label className="coach-card"><span className="coach-label">Role</span><input name="persona" aria-label="Role" required maxLength={200} defaultValue={profile?.persona ?? mission.learner.persona} /></label>
      <label className="coach-card"><span className="coach-label">Goal</span><input name="goal" aria-label="Goal" required maxLength={200} defaultValue={profile?.goal ?? mission.learner.goal} /></label>
      <fieldset className="coach-levels"><legend className="sr-only">Level</legend>{["beginner", "intermediate", "advanced"].map(level => <label key={level}><input type="radio" name="level" value={level} defaultChecked={(profile?.level ?? mission.level) === level} />{level[0].toUpperCase() + level.slice(1)}</label>)}</fieldset>
    </div>
    <div className="coach-footer"><button className="coach-button" type="submit" data-step="save-profile">Next</button></div>
  </form>;
}
