import type { PracticeQuestion, KeyIdea } from "@/lib/store";

export interface EpisodeNotes { title: string; text: string }
export const MAX_EPISODES = 5;
export const MAX_NOTE_CHARACTERS = 20_000;

/** Sections of structured notes that hold navigation, not lessons. */
const SKIP_SECTION = /^(chapters?|timestamps?|links?|references?|links\s*&\s*references|related.*|transcript|sources?|show notes)$/i;
/** Sections whose bullets are the episode's main lessons. */
const PRIORITY_SECTION = /(tl;?dr|summary|key (ideas|takeaways|lessons)|frameworks?|takeaways?|lessons?)/i;

/** Used only when a single episode leaves no other episode to draw wrong answers from. */
const FALLBACK_WRONG = [
  "Make the commitment first and look for evidence afterward.",
  "Ignore the episode's guidance and follow the loudest request.",
  "Plan the full roadmap up front and avoid changing it once work starts.",
  "Add more process to every decision, however small it is.",
  "Copy what competitors ship rather than deciding what should exist.",
];

interface ParsedEpisode { title: string; takeaways: string[] }

/** Removes markdown syntax so a line reads as plain prose. */
function plain(line: string): string {
  return line
    .replace(/\[▶[^\]]*\]\([^)]*\)/g, "")          // timestamp links
    .replace(/\(\s*\)/g, "")                         // brackets left empty by the line above
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")       // links and images → their text
    .replace(/\[\[([^\]|]*)(\|[^\]]*)?\]\]/g, "$1")  // wiki links
    .replace(/(\*\*|__|`)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** A bullet written as "**Name** (…): explanation" keeps only the explanation. */
function bulletTakeaway(line: string): string {
  const cleaned = line
    .replace(/\[▶[^\]]*\]\([^)]*\)/g, "")              // [▶ 00:06:37](url)
    .replace(/`?\b\d{1,2}(:\d{2}){1,2}\b`?/g, "")        // `34:15` or 01:02:03
    .replace(/\(\s*\)/g, "");
  const named = cleaned.match(/^\*\*[^*]+\*\*[^:]{0,80}:\s*(.+)$/);
  return plain(named ? named[1] : line);
}

const usable = (line: string) => line.length >= 25 && line.length <= 500 && /[a-z]/i.test(line);

/** Pulls a display title and an ordered list of takeaways out of plain or markdown notes. */
export function parseEpisode(episode: EpisodeNotes): ParsedEpisode {
  let text = episode.text.replace(/\r/g, "");
  let title = episode.title;

  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (frontmatter) {
    const fmTitle = frontmatter[1].match(/^title:\s*["']?(.+?)["']?\s*$/m);
    if (fmTitle) title = fmTitle[1];
    text = text.slice(frontmatter[0].length);
  }
  const heading = text.match(/^#\s+(.+)$/m);
  if (heading && !frontmatter?.[1].match(/^title:/m)) title = plain(heading[1]);

  const priority: string[] = [];
  const rest: string[] = [];
  let section = "";
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const h = line.match(/^#{1,6}\s+(.+)$/);
    if (h) { section = plain(h[1]); continue; }
    if (SKIP_SECTION.test(section)) continue;
    if (!line || line.startsWith(">") || line.startsWith("|") || /^[-*_]{3,}$/.test(line)) continue;

    const bullet = line.match(/^(?:[-*+]|\d+[.)])\s+(.*)$/);
    const target = PRIORITY_SECTION.test(section) ? priority : rest;
    if (bullet) {
      const takeaway = bulletTakeaway(bullet[1]);
      if (usable(takeaway)) { target.push(takeaway); continue; }
      // Too long for one option: fall through and use its sentences.
    }
    for (const sentence of plain(bullet ? bullet[1] : line).split(/(?<=[.!?])\s+/)) {
      if (usable(sentence)) target.push(sentence);
    }
  }

  const unique = [...new Set([...priority, ...rest])].filter(t => t.toLowerCase() !== title.toLowerCase());
  // A takeaway that names someone or something from the title gives the answer away,
  // so those go last.
  // Distinctive title words: names (not the first word), acronyms like LNO, and hyphenated terms like pre-mortems.
  const distinctive = /\b[A-Z][a-z]{2,}\b|\b[A-Z]{2,}\b|\b[a-z]+-[a-z]+\b/g;
  const titleWords = title.match(distinctive) ?? [];
  const names = new Set(titleWords.filter((w, i) => i > 0 || !/^[A-Z][a-z]+$/.test(w)).map(w => w.toLowerCase().replace(/s$/, "")));
  const givesAway = (t: string) => (t.match(distinctive) ?? []).some(w => names.has(w.toLowerCase().replace(/s$/, "")));
  const takeaways = [...unique.filter(t => !givesAway(t)), ...unique.filter(givesAway)];
  return { title, takeaways };
}

/** Local, source-grounded recall practice; never substitutes the demo fixture for an upload. */
export function episodePractice(episodes: EpisodeNotes[]): { questions: PracticeQuestion[]; keyIdeas: KeyIdea[] } {
  const parsed = episodes.map(episode => {
    const result = parseEpisode(episode);
    if (!result.takeaways.length) throw new Error(`Add a few complete sentences of notes for “${episode.title}”.`);
    return result;
  });
  const keyIdeas = parsed.map((episode, index) => ({ id: `k${index + 1}`, title: episode.title, explanation: episode.takeaways[0] }));
  const situations = [
    "You're preparing your next product decision.",
    "A colleague asks what you learned.",
    "You're reviewing the team's plan.",
    "You need a takeaway for a stakeholder discussion.",
    "You're deciding what to apply at work.",
  ];
  const questions: PracticeQuestion[] = Array.from({ length: 5 }, (_, index) => {
    const episodeIndex = index % parsed.length;
    const episode = parsed[episodeIndex];
    const round = Math.floor(index / parsed.length);
    const takeaway = episode.takeaways[round % episode.takeaways.length];

    // Wrong answers are real takeaways from the other episodes, so the learner has to
    // remember which lesson came from which episode. One episode alone falls back to
    // generic anti-patterns.
    const wrong: string[] = [];
    const others = parsed.filter((_, i) => i !== episodeIndex);
    for (let step = 0; wrong.length < 2 && step < 20 && others.length; step++) {
      const other = others[(index + step) % others.length];
      const candidate = other.takeaways[(round + 1 + Math.floor(step / others.length)) % other.takeaways.length];
      if (candidate !== takeaway && !wrong.includes(candidate) && !episode.takeaways.includes(candidate)) wrong.push(candidate);
    }
    for (let step = 0; wrong.length < 2; step++) {
      const candidate = FALLBACK_WRONG[(index + step) % FALLBACK_WRONG.length];
      if (!wrong.includes(candidate) && candidate !== takeaway) wrong.push(candidate);
    }

    const correctIndex = (index + 1) % 3;
    const options = [...wrong];
    options.splice(correctIndex, 0, takeaway);
    return {
      id: `q${index + 1}`, position: index + 1, type: "multiple_choice", key_idea_id: `k${episodeIndex + 1}`,
      prompt: `${situations[index]} Which takeaway comes from “${episode.title}”?`,
      choices: Object.fromEntries(options.map((option, i) => [String.fromCharCode(65 + i), option])),
      answer: String.fromCharCode(65 + correctIndex),
      explanation: `From “${episode.title}”: ${takeaway}`,
      hint: `Recall the notes from “${episode.title}”.`,
      check_status: "passed", check_notes: null,
    };
  });
  return { questions, keyIdeas };
}
