// editor
import { TEmbedConfig, TEmbedItem, TIssueEmbedConfig, TReadOnlyEmbedConfig } from "@plane/editor";
// types
import { TPageEmbedResponse, TPageEmbedType } from "@plane/types";
// ui
import { PriorityIcon } from "@plane/ui";
// plane web components
import { IssueEmbedCard, IssueEmbedUpgradeCard } from "@/plane-web/components/pages";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// services
import { ProjectPageService } from "@/services/page";

const pageService = new ProjectPageService();

export const useIssueEmbed = (workspaceSlug: string, projectId: string, queryType: TPageEmbedType = "issue") => {
  // store hooks
  const isIssueEmbedEnabled = useFlag("PAGE_ISSUE_EMBEDS");

  const fetchIssues = async (searchQuery: string): Promise<TEmbedItem[]> => {
    const response = await pageService.searchEmbed<TPageEmbedResponse[]>(workspaceSlug, projectId, {
      query_type: queryType,
      query: searchQuery,
      count: 10,
    });
    const structuredIssues: TEmbedItem[] = (response ?? []).map((issue) => ({
      id: issue.id,
      subTitle: `${issue.project__identifier}-${issue.sequence_id}`,
      title: issue.name,
      icon: <PriorityIcon priority={issue.priority} />,
      projectId: projectId,
      workspaceSlug: workspaceSlug,
    }));
    return structuredIssues;
  };

  const searchCallback: TIssueEmbedConfig["searchCallback"] = async (query: string): Promise<TEmbedItem[]> =>
    new Promise((resolve) => {
      setTimeout(async () => {
        const response = await fetchIssues(query);
        const issueItemsWithIdentifiers = response?.map((issue) => ({
          ...issue,
          projectId: projectId.toString(),
          workspaceSlug: workspaceSlug.toString(),
        }));
        resolve(issueItemsWithIdentifiers);
      }, 300);
    });

  const widgetCallback: TIssueEmbedConfig["widgetCallback"] = ({
    issueId,
    projectId: projectIdFromEmbed,
    workspaceSlug: workspaceSlugFromEmbed,
  }) => {
    const resolvedProjectId = projectIdFromEmbed ?? projectId?.toString() ?? "";
    const resolvedWorkspaceSlug = workspaceSlugFromEmbed ?? workspaceSlug?.toString() ?? "";
    return <IssueEmbedCard issueId={issueId} projectId={resolvedProjectId} workspaceSlug={resolvedWorkspaceSlug} />;
  };

  const upgradeCallback = () => <IssueEmbedUpgradeCard />;

  const issueEmbedProps: TEmbedConfig["issue"] = {
    searchCallback,
    widgetCallback,
  };

  const issueEmbedReadOnlyProps: TReadOnlyEmbedConfig["issue"] = {
    widgetCallback,
  };

  const issueEmbedUpgradeProps: TEmbedConfig["issue"] = {
    widgetCallback: upgradeCallback,
  };

  const issueEmbedReadOnlyUpgradeProps: TReadOnlyEmbedConfig["issue"] = {
    widgetCallback: upgradeCallback,
  };

  if (isIssueEmbedEnabled) {
    return {
      issueEmbedProps,
      issueEmbedReadOnlyProps,
    };
  }

  return {
    issueEmbedProps: issueEmbedUpgradeProps,
    issueEmbedReadOnlyProps: issueEmbedReadOnlyUpgradeProps,
  };
};
