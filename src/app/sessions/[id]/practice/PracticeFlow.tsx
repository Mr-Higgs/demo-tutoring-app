"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import type { PracticeQuestion } from "@/lib/store";
import { submitAnswers } from "./actions";
export function PracticeFlow({ sessionId, questions, answers }: { sessionId: string; questions: PracticeQuestion[]; answers: Record<string, string> }) {
  const track = useRef<HTMLDivElement>(null);
  const slides = useRef<(HTMLFieldSetElement | null)[]>([]);
  const [selected, setSelected] = useState(answers);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  function go(index: number) {
    setError("");
    setCurrent(index);
    const first = slides.current[0];
    const slide = slides.current[index];
    if (slide && first) track.current?.scrollTo({ left: slide.offsetLeft - first.offsetLeft, behavior: "instant" });
    slide?.querySelector<HTMLElement>("[role=heading]")?.focus({ preventScroll: true });
  }
  return <main className="coach-screen">
    <header className="coach-header"><span>PM COACH</span>{current ? <button className="coach-back" type="button" onClick={() => go(current - 1)}>Back</button> : <Link href={`/sessions/${sessionId}/material`}>Back</Link>}</header>
    <form className="coach-form" noValidate onSubmit={async event => {
      event.preventDefault();
      const missing = questions.findIndex(question => !selected[question.id]?.trim());
      if (missing !== -1) { go(missing); setError("Choose an answer before continuing."); return; }
      setPending(true);
      const form = new FormData(event.currentTarget);
      try { await submitAnswers(sessionId, form); }
      catch (cause) {
        // Redirects from a Server Action are handled by the Next router.
        if (!(cause instanceof Error && cause.message.includes("NEXT_REDIRECT"))) { setError("Couldn't save your answers. Try again."); setPending(false); }
      }
    }}>
      <div className="practice-track" ref={track} onScroll={() => {
        if (!track.current) return;
        const first = slides.current[0];
        if (!first) return;
        const distances = slides.current.map(slide => slide ? Math.abs(slide.offsetLeft - first.offsetLeft - track.current!.scrollLeft) : Infinity);
        setCurrent(distances.indexOf(Math.min(...distances)));
      }}>
        {questions.map((question, index) => <fieldset className="practice-slide" key={question.id} ref={element => { slides.current[index] = element; }} data-question-type={question.type} aria-label={`Scenario ${index + 1}`}>
          <legend className="sr-only">Scenario {index + 1}</legend><div className="coach-count">SCENARIO {index + 1} OF {questions.length}</div>
          <p role="heading" aria-level={1} className="coach-question" tabIndex={-1}>{question.prompt}</p>
          {question.choices && Object.keys(question.choices).length ? <div className="coach-stack">{Object.entries(question.choices).map(([letter, text]) => <label className="practice-choice" key={letter}><input type="radio" tabIndex={current === index ? undefined : -1} name={`q_${question.id}`} value={letter} checked={selected[question.id] === letter} disabled={pending} onChange={() => { setSelected(previous => ({ ...previous, [question.id]: letter })); setError(""); }} />{text}</label>)}</div> : <label className="coach-paste">Your answer<textarea tabIndex={current === index ? undefined : -1} name={`q_${question.id}`} value={selected[question.id] ?? ""} disabled={pending} rows={4} onChange={event => { setSelected(previous => ({ ...previous, [question.id]: event.target.value })); setError(""); }} /></label>}
          {error && current === index && <p className="coach-error" role="alert">{error}</p>}
          <div className="coach-footer">{index === questions.length - 1 ? <button className="coach-button" tabIndex={current === index ? undefined : -1} type="submit" disabled={pending} data-step="submit-answers">{pending ? "Saving…" : "Next"}</button> : <button className="coach-button" tabIndex={current === index ? undefined : -1} type="button" disabled={pending} onClick={() => { if (!selected[question.id]?.trim()) { setError("Choose an answer before continuing."); return; } go(index + 1); }}>Next</button>}</div>
        </fieldset>)}
      </div>
    </form>
  </main>;
}
