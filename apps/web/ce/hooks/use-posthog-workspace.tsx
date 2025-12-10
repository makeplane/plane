import type { IWorkspace } from "@plane/types";

/**
 * Workspace data format for PostHog analytics
 */
export type TPosthogWorkspaceData = Record<string, unknown> | null;

export function usePosthogWorkspace(_workspace: IWorkspace | null | undefined): TPosthogWorkspaceData {
  return null;
}
