import { TDeDupeIssue } from "@plane/types";

export const useDebouncedDuplicateIssues = (
  workspaceId: string | undefined,
  projectId: string | undefined,
  formData: { name: string | undefined; description_html?: string | undefined; issueId?: string | undefined }
) => {
  const duplicateIssues: TDeDupeIssue[] = [];

  return { duplicateIssues };
};
