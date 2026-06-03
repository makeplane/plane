import useSWR from "swr";
import type { TIssueProperty } from "@plane/types";
import { IssuePropertyService } from "@/services/issue";

const issuePropertyService = new IssuePropertyService();

export const getProjectCustomFieldsKey = (workspaceSlug: string, projectId: string) =>
  `PROJECT_CUSTOM_FIELDS_${workspaceSlug}_${projectId}`;

export function useProjectCustomFields(workspaceSlug: string | undefined, projectId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<TIssueProperty[], Error>(
    workspaceSlug && projectId ? getProjectCustomFieldsKey(workspaceSlug, projectId) : null,
    async (): Promise<TIssueProperty[]> => issuePropertyService.listProperties(workspaceSlug!, projectId!, true),
    { revalidateOnFocus: false }
  );

  const activeProperties = (data ?? []).filter((p) => p.is_active).toSorted((a, b) => a.sort_order - b.sort_order);

  return {
    properties: activeProperties,
    isLoading,
    error,
    mutate,
    issuePropertyService,
  };
}
