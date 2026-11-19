// Your mission, in one file. This is the first place to personalize: who the
// app is for, what they're learning, what the practice looks like, and which
// features (src/features/) are turned on. Nothing here needs a restart beyond
// the usual dev-server reload.

export type Level = "beginner" | "intermediate" | "advanced";
export type QuestionType = "multiple_choice" | "fill_in" | "short_answer" | "scenario" | "flashcard";
export type MaterialKind = "text" | "photo" | "pdf";
export type FeedbackTone = "encouraging" | "direct" | "playful";

export interface MissionConfig {
  appName: string;
  tagline: string;
  learner: { name: string; persona: string; goal: string }; // screen 1
  topic: string;
  level: Level; // screen 1
  material: { kinds: MaterialKind[]; prompt: string; examples: string }; // screen 2
  practice: { questionTypes: QuestionType[]; count: number }; // screen 3
  feedback: { tone: FeedbackTone }; // screen 4
  features: string[]; // ids from src/features
  theme: { accent: string; headingFont?: string };
}

export const mission: MissionConfig = {
  appName: "PM COACH",
  tagline: "Turn podcast notes into frameworks you can use at work. Five scenarios in under 10 minutes.",
  learner: {
    name: "Mia",
    persona: "Product manager",
    goal: "Frameworks I can use at work",
  },
  topic: "product management frameworks",
  level: "advanced",
  material: {
    kinds: ["text", "photo", "pdf"],
    prompt: "What are we learning from?",
    examples: "Podcast episode notes: PDF, text or a photo",
  },
  practice: {
    questionTypes: ["multiple_choice"],
    count: 5,
  },
  feedback: { tone: "direct" },
  features: [],
  theme: { accent: "#FFD02F" },
};
