import { PlaneUser } from "@plane/sdk";

// Mock implementations for missing helpers
export const replaceIssueNumber = (text: string, projectId: string) => text;
export const replaceMentionedGlUsers = (
  text: string,
  workspaceSlug: string,
  userMap: Record<string, string>,
  planeUsers: PlaneUser[],
) => text;
