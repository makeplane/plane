export const AI_EDITOR_TASKS = {
  ASK_ANYTHING: "ASK_ANYTHING",
} as const;

export type AI_EDITOR_TASKS = typeof AI_EDITOR_TASKS[keyof typeof AI_EDITOR_TASKS];

export const LOADING_TEXTS: {
  [key in AI_EDITOR_TASKS]: string;
} = {
  [AI_EDITOR_TASKS.ASK_ANYTHING]: "Pi is generating response",
};
