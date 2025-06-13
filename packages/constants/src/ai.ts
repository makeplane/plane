export const AI_EDITOR_TASKS = {
  ASK_ANYTHING: "ASK_ANYTHING",
} as const;

export type AI_EDITOR_TASKS = typeof AI_EDITOR_TASKS[keyof typeof AI_EDITOR_TASKS];
