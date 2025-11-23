import type { IssueActions } from "@/hooks/use-issues-actions";

export const useTeamIssueActions: () => IssueActions = () => ({
  fetchIssues: () => Promise.resolve(undefined),
  fetchNextIssues: () => Promise.resolve(undefined),
  removeIssue: () => Promise.resolve(undefined),
  updateFilters: () => Promise.resolve(undefined),
});

export const useTeamViewIssueActions: () => IssueActions = () => ({
  fetchIssues: () => Promise.resolve(undefined),
  fetchNextIssues: () => Promise.resolve(undefined),
  removeIssue: () => Promise.resolve(undefined),
  updateFilters: () => Promise.resolve(undefined),
});

export const useTeamProjectWorkItemsActions: () => IssueActions = () => ({
  fetchIssues: () => Promise.resolve(undefined),
  fetchNextIssues: () => Promise.resolve(undefined),
  removeIssue: () => Promise.resolve(undefined),
  updateFilters: () => Promise.resolve(undefined),
});
