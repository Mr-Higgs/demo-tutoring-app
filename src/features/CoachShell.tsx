import Link from "next/link";
import type { ReactNode } from "react";

export function CoachShell({ children, back, className = "" }: { children: ReactNode; back?: string; className?: string }) {
  return <main className={`coach-screen ${className}`}>
    <header className="coach-header"><span>PM COACH</span>{back && <Link href={back}>Back</Link>}</header>
    {children}
  </main>;
}
