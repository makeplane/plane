export const getProgress = (completed: number | undefined, total: number | undefined) =>
  total && total > 0 ? Math.round(((completed ?? 0) / total) * 100) : 0;
