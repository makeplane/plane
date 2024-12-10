import { useCallback } from "react";
// plane editor
import { TMentionSection, TMentionSuggestion } from "@plane/editor";
// plane types
import { TSearchEntities } from "@plane/types";
// plane ui
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// plane web constants
import { EDITOR_MENTION_TYPES } from "@/plane-web/constants/editor";
// plane web hooks
import { useAdditionalEditorMention } from "@/plane-web/hooks/use-additional-editor-mention";
// services
import { ProjectService } from "@/services/project";
const projectService = new ProjectService();

type TArgs = {
  projectId: string;
  workspaceSlug: string;
};

export const useEditorMention = (args: TArgs) => {
  const { projectId, workspaceSlug } = args;
  // additional mentions
  const { updateAdditionalSections } = useAdditionalEditorMention();
  // fetch mentions handler
  const fetchMentions = useCallback(
    async (query: string): Promise<TMentionSection[]> => {
      try {
        const res = await projectService.searchEntity(workspaceSlug, projectId, {
          count: 5,
          query_type: EDITOR_MENTION_TYPES,
          query,
        });
        const suggestionSections: TMentionSection[] = [];
        if (!res) {
          throw new Error("No response found");
        }
        Object.keys(res).map((key) => {
          const responseKey = key as TSearchEntities;
          if (responseKey === "user_mention" && res[responseKey] && res[responseKey].length > 0) {
            const items: TMentionSuggestion[] = res[responseKey].map((user) => ({
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
            suggestionSections.push({
              key: "users",
              title: "Users",
              items,
            });
          }
        });
        updateAdditionalSections({
          response: res,
          sections: suggestionSections,
        });
        return suggestionSections;
      } catch (error) {
        console.error("Error in fetching mentions for project pages:", error);
        throw error;
      }
    },
    [projectId, updateAdditionalSections, workspaceSlug]
  );

  return {
    fetchMentions,
  };
};
