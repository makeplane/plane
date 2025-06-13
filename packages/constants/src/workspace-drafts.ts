export const EDraftIssuePaginationType = {
  INIT: "INIT",
  NEXT: "NEXT",
  PREV: "PREV",
  CURRENT: "CURRENT",
} as const;

export type EDraftIssuePaginationType = typeof EDraftIssuePaginationType[keyof typeof EDraftIssuePaginationType];
