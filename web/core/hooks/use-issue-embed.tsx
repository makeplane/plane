// editor
import { TEmbedItem } from "@plane/document-editor";
// types
import { TPageEmbedResponse } from "@plane/types";
// ui
import { PriorityIcon } from "@plane/ui";
// services
import { PageService } from "@/services/page.service";

const pageService = new PageService();

export const useIssueEmbed = (workspaceSlug: string, projectId: string) => {
  const fetchIssues = async (searchQuery: string): Promise<TEmbedItem[]> =>
    await pageService
      .searchEmbed<TPageEmbedResponse[]>(workspaceSlug, projectId, {
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
