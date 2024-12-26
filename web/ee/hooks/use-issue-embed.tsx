// plane editor
import { TEmbedItem, TIssueEmbedConfig } from "@plane/editor";
// plane ui
import { PriorityIcon } from "@plane/ui";
// plane web components
import { IssueEmbedCard, IssueEmbedUpgradeCard } from "@/plane-web/components/pages";
// plane web hooks
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// services
import { WorkspaceService } from "@/plane-web/services/workspace.service";
const workspaceService = new WorkspaceService();

export const useIssueEmbed = (workspaceSlug: string, projectId: string) => {
  // store hooks
  const isIssueEmbedEnabled = useFlag(workspaceSlug, "PAGE_ISSUE_EMBEDS");

  const fetchIssues = async (searchQuery: string): Promise<TEmbedItem[]> => {
    const response = await workspaceService.searchEntity(workspaceSlug, {
      query_type: ["issue"],
      query: searchQuery,
      count: 10,
      project_id: projectId,
    });
    const structuredIssues: TEmbedItem[] = (response.issue ?? []).map((issue) => ({
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

  const issueEmbedProps: TIssueEmbedConfig = {
    searchCallback: isIssueEmbedEnabled ? searchCallback : undefined,
    widgetCallback: isIssueEmbedEnabled ? widgetCallback : upgradeCallback,
  };

  return {
    issueEmbedProps,
  };
};
