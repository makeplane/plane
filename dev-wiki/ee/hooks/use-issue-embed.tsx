import { useCallback, useMemo } from "react";
// plane editor
import { TEmbedItem, TIssueEmbedConfig } from "@plane/editor";
import { TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
// plane ui
import { PriorityIcon } from "@plane/ui";
// ce hooks
// plane web components
import { IssueEmbedCard, IssueEmbedUpgradeCard } from "@/plane-web/components/pages";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store/use-flag";

export type TIssueEmbedHookProps = {
  fetchEmbedSuggestions?: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
  projectId?: string;
  workspaceSlug?: string;
};

export const useIssueEmbed = (props: TIssueEmbedHookProps) => {
  const { fetchEmbedSuggestions, projectId, workspaceSlug } = props;
  // store hooks
  const isIssueEmbedEnabled = useFlag(workspaceSlug, "PAGE_ISSUE_EMBEDS");

  const fetchIssues = useCallback(
    async (searchQuery: string): Promise<TEmbedItem[]> => {
      const response = await fetchEmbedSuggestions?.({
        query_type: ["issue"],
        query: searchQuery,
        count: 10,
      });
      const structuredIssues: TEmbedItem[] = (response?.issue ?? []).map((issue) => ({
        id: issue.id,
        subTitle: `${issue.project__identifier}-${issue.sequence_id}`,
        title: issue.name,
        icon: <PriorityIcon priority={issue.priority} />,
        projectId: issue.project_id?.toString() ?? "",
        workspaceSlug: workspaceSlug?.toString() ?? "",
      }));
      return structuredIssues;
    },
    [fetchEmbedSuggestions, workspaceSlug]
  );

  const searchCallback: TIssueEmbedConfig["searchCallback"] = useCallback(
    async (query: string): Promise<TEmbedItem[]> =>
      new Promise((resolve) => {
        setTimeout(async () => {
          const response = await fetchIssues(query);
          resolve(response);
        }, 300);
      }),
    [fetchIssues]
  );

  const widgetCallback: TIssueEmbedConfig["widgetCallback"] = useCallback(
    ({ issueId, projectId: projectIdFromEmbed, workspaceSlug: workspaceSlugFromEmbed }) => {
      const resolvedProjectId = projectIdFromEmbed ?? projectId?.toString() ?? "";
      const resolvedWorkspaceSlug = workspaceSlugFromEmbed ?? workspaceSlug?.toString() ?? "";
      return <IssueEmbedCard issueId={issueId} projectId={resolvedProjectId} workspaceSlug={resolvedWorkspaceSlug} />;
    },
    [projectId, workspaceSlug]
  );

  const upgradeCallback = useCallback(() => <IssueEmbedUpgradeCard />, []);

  const issueEmbedProps: TIssueEmbedConfig = useMemo(
    () => ({
      searchCallback: isIssueEmbedEnabled ? searchCallback : undefined,
      widgetCallback: isIssueEmbedEnabled ? widgetCallback : upgradeCallback,
    }),
    [isIssueEmbedEnabled, searchCallback, upgradeCallback, widgetCallback]
  );

  const returnValue = useMemo(
    () => ({
      issueEmbedProps,
    }),
    [issueEmbedProps]
  );

  return returnValue;
};
