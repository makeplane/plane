import type { TDeDupeIssue } from "@plane/types";

export const useDebouncedDuplicateIssues = (
  workspaceSlug: string | undefined,
  workspaceId: string | undefined,
  projectId: string | undefined,
  formData: { name: string | undefined; description_html?: string | undefined; issueId?: string | undefined },
  isCreationModal: boolean = false
) => {
  const duplicateIssues: TDeDupeIssue[] = [];

  return { duplicateIssues };
};
