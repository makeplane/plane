// editor
import { TEmbedItem } from "@plane/editor";
// types
import { TPageEmbedResponse } from "@plane/types";
// ui
import { PriorityIcon } from "@plane/ui";
// plane web services
import { WorkspacePageService } from "@/plane-web/services/page";
const pageService = new WorkspacePageService();

export const useWorkspaceIssueEmbed = (workspaceSlug: string) => {
  const fetchIssues = async (searchQuery: string): Promise<TEmbedItem[]> =>
    await pageService
      .searchEmbed<TPageEmbedResponse[]>(workspaceSlug, {
        query_type: "issue",
        query: searchQuery,
        count: 10,
      })
      .then((res) => {
        const structuredIssues: TEmbedItem[] = (res ?? []).map((issue) => ({
          id: issue.id,
          subTitle: `${issue.project__identifier}-${issue.sequence_id}`,
          title: issue.name,
          icon: <PriorityIcon priority={issue.priority} />,
          projectId: issue.project_id,
          workspaceSlug,
        }));

        return structuredIssues;
      })
      .catch((err) => {
        throw Error(err);
      });

  return {
    fetchIssues,
  };
};
