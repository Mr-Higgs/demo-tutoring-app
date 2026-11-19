import type { PracticeQuestion, KeyIdea } from "@/lib/store";

export interface EpisodeNotes { title: string; text: string }
export const MAX_EPISODES = 5;
export const MAX_NOTE_CHARACTERS = 20_000;

/** Local, source-grounded recall practice; never substitutes the demo fixture for an upload. */
export function episodePractice(episodes: EpisodeNotes[]): { questions: PracticeQuestion[]; keyIdeas: KeyIdea[] } {
  const takeaways = episodes.map(episode => {
    const lines = episode.text.replace(/\r/g, "").split(/\n+|(?<=[.!?])\s+/)
      .map(line => line.replace(/^\s*[-*#\d.)]+\s*/, "").trim())
      .filter(line => line.length >= 25 && line.length <= 500);
    if (!lines.length) throw new Error(`Add a few complete sentences of notes for “${episode.title}”.`);
    return lines;
  });
  const keyIdeas = episodes.map((episode, index) => ({ id: `k${index + 1}`, title: episode.title, explanation: takeaways[index][0] }));
  const situations = [
    "You're preparing your next product decision.",
    "A colleague asks what you learned.",
    "You're reviewing the team's plan.",
    "You need a takeaway for a stakeholder discussion.",
    "You're deciding what to apply at work.",
  ];
  const questions: PracticeQuestion[] = Array.from({ length: 5 }, (_, index) => {
    const episodeIndex = index % episodes.length;
    const episode = episodes[episodeIndex];
    const lines = takeaways[episodeIndex];
    const takeaway = lines[Math.floor(index / episodes.length) % lines.length];
    const correctIndex = (index + 1) % 3;
    const options = [
      "Make the commitment first and look for evidence afterward.",
      "Ignore the episode's guidance and follow the loudest request.",
    ];
    options.splice(correctIndex, 0, takeaway);
    return {
      id: `q${index + 1}`, position: index + 1, type: "multiple_choice", key_idea_id: `k${episodeIndex + 1}`,
      prompt: `${situations[index]} Which takeaway is supported by “${episode.title}”?`,
      choices: Object.fromEntries(options.map((option, i) => [String.fromCharCode(65 + i), option])),
      answer: String.fromCharCode(65 + correctIndex),
      explanation: `From “${episode.title}”: ${takeaway}`,
      hint: `Recall the notes from “${episode.title}”.`,
      check_status: "passed", check_notes: null,
    };
  });
  return { questions, keyIdeas };
}
