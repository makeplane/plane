// plane editor
import { TMentionSuggestion } from "@plane/editor";
// plane types
import { TSearchEntities, TUserSearchResponse } from "@plane/types";
// plane ui
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// services
import { ProjectService } from "@/services/project";
const projectService = new ProjectService();

type TArgs = {
  projectId: string;
  workspaceSlug: string;
};

export const useEditorMention = (args: TArgs) => {
  const { projectId, workspaceSlug } = args;
  // fetch mentions handler
  const fetchMentions = async <T extends TSearchEntities>(
    query: string,
    queryType: T
  ): Promise<TMentionSuggestion[]> => {
    try {
      const res = await projectService.searchEntity<T>(workspaceSlug, projectId, {
        count: 10,
        query_type: queryType,
        query,
      });
      if (!res) {
        throw new Error("No response found");
      }
      if (queryType === "user_mention") {
        const userResults = res as TUserSearchResponse[];
        return userResults.map((user) => ({
          icon: (
            <Avatar
              className="flex-shrink-0"
              src={getFileURL(user.member__avatar_url)}
              name={user.member__display_name}
            />
          ),
          id: user.member__id,
          entity_identifier: user.member__id,
          entity_name: "user_mention",
          title: user.member__display_name,
        }));
      } else {
        throw new Error("Invalid query type");
      }
    } catch (error) {
      console.error("Error in fetching mentions for project pages:", error);
      throw error;
    }
  };

  return {
    fetchMentions,
  };
};
