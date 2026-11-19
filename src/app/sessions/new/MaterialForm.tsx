"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MAX_EPISODES, MAX_NOTE_CHARACTERS, type EpisodeNotes } from "@/features/episode-practice";
import { useSample as openSample } from "./actions";
import { createEpisodeSession } from "./episode-actions";

export function MaterialForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  function addFiles(incoming: File[]) {
    setError("");
    if (incoming.length + files.length + (notes.trim() ? 1 : 0) > MAX_EPISODES) { setError("Choose up to 5 episodes per session."); return; }
    setFiles(current => [...current, ...incoming]);
  }
  function sample() { startTransition(async () => { await openSample(); }); }
  function next() {
    setError("");
    if (!files.length && !notes.trim()) { sample(); return; }
    startTransition(async () => {
      try {
        const episodes: EpisodeNotes[] = [];
        let pages = 0;
        if (files.length) {
          const { readEpisode } = await import("@/features/read-episode");
          for (const file of files) {
            setProgress(`Reading ${file.name}…`);
            const episode = await readEpisode(file, setProgress);
            pages += episode.pages;
            if (pages > 20) throw new Error("Use at most 20 pages across all episodes.");
            episodes.push({ title: episode.title, text: episode.text });
          }
        }
        if (notes.trim()) episodes.push({ title: title.trim() || "Pasted episode notes", text: notes });
        if (episodes.reduce((sum, episode) => sum + episode.text.length, 0) > MAX_NOTE_CHARACTERS) throw new Error("Keep the combined notes under 20,000 characters. Nothing has been saved.");
        setProgress("Preparing five questions across your episodes…");
        const result = await createEpisodeSession(episodes);
        if ("error" in result) { setError(result.error); return; }
        router.push(`/sessions/${result.sessionId}/material`);
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't read that file. Try pasting the notes instead."); }
      finally { setProgress(""); }
    });
  }
  return <form className="coach-form" onSubmit={event => { event.preventDefault(); next(); }}>
    <label className={`coach-drop ${dragging ? "dragging" : ""}`} htmlFor="episode-files" onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (!pending) addFiles(Array.from(event.dataTransfer.files)); }}>
      <p className="font-semibold">Drop episode notes</p><small>PDF, text or a photo</small>
    </label>
    <input id="episode-files" className="sr-only" aria-label="Upload episode notes" type="file" accept=".txt,.md,.pdf,image/jpeg,image/png,image/webp" multiple disabled={pending} onChange={event => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    {!files.length && !notes.trim() ? <button className="coach-card coach-added" type="button" data-step="use-sample" disabled={pending} onClick={sample} aria-label="Use sample: Lenny's Podcast: prioritization"><span className="coach-label">Added</span><span className="coach-value">Lenny&apos;s Podcast: prioritization</span></button> : <div className="coach-upload-list">{files.map((file, index) => <div className="coach-card coach-upload-item" key={`${file.name}-${index}`}><div><span className="coach-label">Episode {index + 1}</span><p className="coach-value">{file.name}</p></div><button type="button" disabled={pending} aria-label={`Remove ${file.name}`} onClick={() => setFiles(current => current.filter((_, i) => i !== index))}>×</button></div>)}</div>}
    <details className="coach-paste"><summary>Add multiple episodes or paste notes</summary><p className="coach-help">Up to 5 episodes · 20 pages · 20,000 characters total. Five questions across every episode, about 7 minutes.</p><label>Episode title<input value={title} maxLength={120} disabled={pending} onChange={event => setTitle(event.target.value)} /></label><label>Episode notes<textarea rows={4} value={notes} maxLength={MAX_NOTE_CHARACTERS} disabled={pending} placeholder="Paste a few complete sentences from an episode…" onChange={event => setNotes(event.target.value)} /></label><p className="coach-help">PDF and text stay in your browser until extracted. English photo reading may download a language model; paste notes if it cannot load.</p></details>
    {error && <p className="coach-error" role="alert">{error}</p>}
    {pending && <p className="coach-help" role="status">{progress || "Opening the sample…"}</p>}
    <div className="coach-footer"><button className="coach-button" type="submit" disabled={pending}>{pending ? "Reading notes…" : "Next"}</button></div>
  </form>;
}
