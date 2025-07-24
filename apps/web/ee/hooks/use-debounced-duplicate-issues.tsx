import { useState, useEffect } from "react";
import useSWR from "swr";
// types
import { TDeDupeIssue } from "@plane/types";
// helpers
import { getTextContent } from "@plane/utils";
// hooks
import useDebounce from "@/hooks/use-debounce";
// services
import { PIService } from "@/plane-web/services";
import { useFlag } from "./store";

const piService = new PIService();

export const useDebouncedDuplicateIssues = (
  workspaceSlug: string | undefined,
  workspaceId: string | undefined,
  projectId: string | undefined,
  formData: { name: string | undefined; description_html?: string | undefined; issueId?: string | undefined }
) => {
  const [debouncedFormData, setDebouncedFormData] = useState(formData);

  // Check if the feature flag is enabled
  const isFeatureEnabled = useFlag(workspaceSlug, "PI_DEDUPE");

  // Debounce the name and description
  const debouncedName = useDebounce(formData?.name, 3000);
  const debouncedDescription = useDebounce(formData?.description_html, 3000);

  // Update debounced form data
  useEffect(() => {
    setDebouncedFormData({
      name: debouncedName,
      description_html: debouncedDescription,
    });
  }, [debouncedName, debouncedDescription]);

  const shouldFetch =
    workspaceId && projectId && debouncedFormData.name && debouncedFormData.name.trim() !== "" && isFeatureEnabled;

  // Fetch duplicate issues
  const { data: issues } = useSWR(
    shouldFetch ? `DUPLICATE_ISSUE_${workspaceId}_${projectId}_${debouncedFormData.name}` : null,
    shouldFetch
      ? async () =>
          await piService.getDuplicateIssues({
            workspace_id: workspaceId.toString(),
            project_id: projectId,
            issue_id: formData?.issueId,
            title: debouncedFormData.name,
            description_stripped: getTextContent(debouncedFormData.description_html),
          })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const duplicateIssues: TDeDupeIssue[] = issues?.dupes ?? [];

  return { duplicateIssues };
};
