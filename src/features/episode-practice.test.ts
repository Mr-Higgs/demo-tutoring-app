import { test } from "node:test";
import assert from "node:assert/strict";
import { episodePractice } from "./episode-practice";
import { checkPractice } from "../lib/checks/practice";
import { gradeByApp } from "../lib/checks/grade";

test("all five uploaded sources appear in the five-question session", () => {
  const episodes = Array.from({length: 5}, (_, i) => ({ title: `Episode ${i + 1}`, text: `Unique lesson ${i + 1}: interview customers before choosing a product solution.` }));
  const {questions, keyIdeas} = episodePractice(episodes);
  assert.deepEqual(new Set(questions.map(q => q.key_idea_id)), new Set(keyIdeas.map(k => k.id)));
  for (const question of questions) {
    const sourceIndex = keyIdeas.findIndex(k => k.id === question.key_idea_id);
    assert.ok(episodes[sourceIndex].text.includes(question.choices![question.answer]));
    assert.ok(question.explanation.includes(episodes[sourceIndex].title));
  }
});

test("two unrelated uploads produce grounded content, not the demo's CEO quiz", () => {
  const episodes = [{ title: "Research", text: "Interview recent churned customers to understand why they left. Use actual customer evidence before proposing a fix." }, { title: "Pricing", text: "Test willingness to pay before setting a new price. Segment customers by the value they receive from your product." }];
  const {questions, keyIdeas} = episodePractice(episodes);
  const checked = checkPractice({questions}, {count: 5, questionTypes: ["multiple_choice"], keyIdeaIds: keyIdeas.map(k => k.id)});
  assert.deepEqual(checked.problems, []);
  assert.ok(checked.questions.every(q => q.problems.length === 0));
  assert.ok(questions.some(q => q.explanation.includes("willingness to pay")));
  assert.ok(questions.some(q => q.explanation.includes("churned customers")));
  assert.ok(!JSON.stringify(questions).includes("CEO"));
  assert.ok(new Set(questions.map(q => q.answer)).size > 1);
});

test("each generated right and wrong option is scored by the unchanged core", () => {
  const {questions} = episodePractice([{ title: "Discovery", text: "Test demand with a small experiment before building the full product." }]);
  questions.forEach(question => {
    assert.equal(gradeByApp(question, question.answer)?.result, "right");
    const wrong = Object.keys(question.choices!).find(key => key !== question.answer)!;
    assert.equal(gradeByApp(question, wrong)?.result, "not_yet");
  });
});

test("structured markdown notes use real lessons, not headings, and other episodes as wrong answers", () => {
  const note = (name: string, lessons: string[]) => ({
    title: `2026-01-01-${name.toLowerCase()}`,
    text: `---\ntitle: "${name} on product"\n---\n\n# ${name} on product\n> A short subtitle line for ${name}.\n\n## TL;DR\n\n${lessons.map(l => `- ${l}`).join("\n")}\n\n## Key ideas & frameworks\n\n- **Named idea** ([▶ 00:01:02](https://example.com/watch?t=62s)): ${name} explains why small bets beat big launches every time.\n\n## Chapters\n\n- 00:00 Intro to the whole conversation with the guest\n`,
  });
  const episodes = [
    note("Alpha", ["Run pre-mortems before every major launch decision.", "Sort tasks by leverage before choosing what to polish."]),
    note("Beta", ["Leaders should stay in the details of the work they review."]),
    note("Gamma", ["Hire systems thinkers who build shared platforms for teams."]),
  ];
  const { questions, keyIdeas } = episodePractice(episodes);
  assert.deepEqual(keyIdeas.map(k => k.title), ["Alpha on product", "Beta on product", "Gamma on product"]);
  const all = JSON.stringify(questions);
  for (const leak of ["# ", "**", "▶", "subtitle", "Intro to the whole"]) assert.ok(!all.includes(leak), leak);
  const lessons = episodes.flatMap(e => e.text.split("\n").filter(l => l.startsWith("- ") && !l.includes("Intro")).map(l => l.slice(2)));
  for (const q of questions) {
    const source = episodes[keyIdeas.findIndex(k => k.id === q.key_idea_id)];
    assert.ok(source.text.includes(q.choices![q.answer]));
    for (const [letter, choice] of Object.entries(q.choices!)) {
      if (letter === q.answer) continue;
      assert.ok(!source.text.includes(choice), "a wrong answer came from the same episode");
      assert.ok(lessons.some(l => l.includes(choice)), "wrong answers come from the other episodes' notes");
    }
  }
});
