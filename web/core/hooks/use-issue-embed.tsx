// editor
import { TEmbedItem } from "@plane/document-editor";
// types
import { TPageEmbedResponse, TPageEmbedType } from "@plane/types";
// ui
import { PriorityIcon } from "@plane/ui";
// services
import { ProjectPageService } from "@/services/page";

const pageService = new ProjectPageService();

export const useIssueEmbed = (workspaceSlug: string, projectId: string, queryType: TPageEmbedType = "issue") => {
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

  return {
    fetchIssues,
  };
};
