/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
// plane editor
import type { TMentionSection, TMentionSuggestion } from "@plane/editor";
// plane types
import type { TIssueSearchResponse, TProjectSearchResponse, TSearchEntities, TSearchResponse } from "@plane/types";
import { generateWorkItemLink } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useParams } from "next/navigation";

export type TUseAdditionalEditorMentionArgs = {
  enableAdvancedMentions: boolean;
};

export type TAdditionalEditorMentionHandlerArgs = {
  response: TSearchResponse;
};

export type TAdditionalEditorMentionHandlerReturnType = {
  sections: TMentionSection[];
};

export type TAdditionalParseEditorContentArgs = {
  id: string;
  entityType: TSearchEntities;
};

export type TAdditionalParseEditorContentReturnType =
  | {
      redirectionPath: string;
      textContent: string;
    }
  | undefined;

export const useAdditionalEditorMention = (args: TUseAdditionalEditorMentionArgs) => {
  const { enableAdvancedMentions } = args;
  const { workspaceSlug } = useParams();
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const updateAdditionalSections = useCallback(
    ({ response }: TAdditionalEditorMentionHandlerArgs): TAdditionalEditorMentionHandlerReturnType => {
      if (!enableAdvancedMentions) {
        return { sections: [] };
      }

      const sections: TMentionSection[] = [];

      if (response.issue?.length) {
        const items: TMentionSuggestion[] = (response.issue as TIssueSearchResponse[]).map((issue) => ({
          id: issue.id,
          entity_identifier: issue.id,
          entity_name: "issue",
          entity_display_name: `${issue.project__identifier}-${issue.sequence_id}`,
          title: `${issue.project__identifier}-${issue.sequence_id}`,
          subTitle: issue.name,
          icon: null,
        }));
        sections.push({
          key: "issues",
          title: "Work items",
          items,
        });
      }

      if (response.project?.length) {
        const items: TMentionSuggestion[] = (response.project as TProjectSearchResponse[]).map((project) => ({
          id: project.id,
          entity_identifier: project.id,
          entity_name: "project",
          entity_display_name: project.identifier,
          title: project.identifier,
          subTitle: project.name,
          icon: null,
        }));
        sections.push({
          key: "projects",
          title: "Projects",
          items,
        });
      }

      return { sections };
    },
    [enableAdvancedMentions]
  );

  const parseAdditionalEditorContent = useCallback(
    ({ id, entityType }: TAdditionalParseEditorContentArgs): TAdditionalParseEditorContentReturnType => {
      if (!enableAdvancedMentions || !workspaceSlug) return undefined;

      if (entityType === "issue") {
        const issue = getIssueById(id);
        const project = issue?.project_id ? getProjectById(issue.project_id) : undefined;
        const identifier = project?.identifier;
        const sequenceId = issue?.sequence_id;

        if (!identifier || sequenceId === undefined) return undefined;

        return {
          textContent: `${identifier}-${sequenceId}`,
          redirectionPath: generateWorkItemLink({
            workspaceSlug: workspaceSlug.toString(),
            projectIdentifier: identifier,
            sequenceId,
            issueId: id,
            projectId: issue?.project_id,
          }),
        };
      }

      if (entityType === "project") {
        const project = getProjectById(id);
        if (!project) return undefined;

        return {
          textContent: project.identifier,
          redirectionPath: `/${workspaceSlug.toString()}/projects/${id}/`,
        };
      }

      return undefined;
    },
    [enableAdvancedMentions, getIssueById, getProjectById, workspaceSlug]
  );

  const editorMentionTypes: TSearchEntities[] = useMemo(
    () => (enableAdvancedMentions ? ["user_mention", "issue", "project"] : ["user_mention"]),
    [enableAdvancedMentions]
  );

  return {
    updateAdditionalSections,
    parseAdditionalEditorContent,
    editorMentionTypes,
  };
};
