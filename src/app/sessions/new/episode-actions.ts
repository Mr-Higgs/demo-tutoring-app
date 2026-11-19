"use server";
import { getProfile, createSession, updateSession } from "@/lib/store";
import { checkPractice } from "@/lib/checks";
import { episodePractice, MAX_EPISODES, MAX_NOTE_CHARACTERS, type EpisodeNotes } from "@/features/episode-practice";

export async function createEpisodeSession(input: EpisodeNotes[]): Promise<{ sessionId: string } | { error: string }> {
  if (!await getProfile()) return { error: "Set up your profile first." };
  if (!Array.isArray(input) || !input.length || input.length > MAX_EPISODES) return { error: "Add between 1 and 5 episodes." };
  const episodes: EpisodeNotes[] = [];
  for (const item of input) {
    if (!item || typeof item.title !== "string" || typeof item.text !== "string" || item.title.length > 120 || !item.title.trim() || item.text.trim().length < 40) {
      return { error: "Give each episode a title and at least a few sentences of readable notes." };
    }
    episodes.push({ title: item.title.trim(), text: item.text.trim() });
  }
  if (episodes.reduce((total, episode) => total + episode.text.length, 0) > MAX_NOTE_CHARACTERS) return { error: "Keep the combined notes under 20,000 characters. No notes have been saved." };
  let practice;
  try { practice = episodePractice(episodes); }
  catch (error) { return { error: error instanceof Error ? error.message : "Couldn't read those notes. Try pasting complete sentences." }; }
  const checked = checkPractice({ questions: practice.questions }, { count: 5, questionTypes: ["multiple_choice"], keyIdeaIds: practice.keyIdeas.map(idea => idea.id) });
  if (checked.problems.length || checked.questions.some(question => question.problems.length)) return { error: "Couldn't make a valid set from these notes. Try adding more detail." };
  const text = episodes.map(episode => `# ${episode.title}\n${episode.text}`).join("\n\n");
  const title = episodes.length === 1 ? episodes[0].title : `${episodes.length} podcast episodes`;
  const session = await createSession({ kind: "text", title, text });
  await updateSession(session.id, current => ({
    ...current,
    material: { ...current.material, status: "ready", summary: `Practice across ${episodes.length === 1 ? "this episode" : `all ${episodes.length} episodes`}. Five questions, about 7 minutes.`, key_ideas: practice.keyIdeas },
    practice: { ...current.practice, status: "ready", questions: practice.questions },
  }));
  return { sessionId: session.id };
}
