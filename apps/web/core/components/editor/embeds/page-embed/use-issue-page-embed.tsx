/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import { FileText } from "lucide-react";
// plane imports
import { CORE_EXTENSIONS } from "@plane/editor";
import type { IEditorPropsExtended } from "@plane/editor";
import { EIssueServiceType } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// services
import { ProjectPageService } from "@/services/page/project-page.service";
// local imports
import { PageEmbedCard } from "./card";

const projectPageService = new ProjectPageService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

/**
 * Wires the "/page" slash command and the page-embed node view for a work item
 * description: creates a real project page, embeds a clickable block, and links
 * the page back to the work item.
 */
export const useIssuePageEmbed = ({ workspaceSlug, projectId, issueId }: Props): IEditorPropsExtended => {
  const { createLink } = useIssueDetail(EIssueServiceType.ISSUES);

  const pageEmbedWidgetCallback = useCallback(
    ({ pageId, pageTitle }: { pageId: string; pageTitle: string }) => (
      <PageEmbedCard pageId={pageId} pageTitle={pageTitle} workspaceSlug={workspaceSlug} projectId={projectId} />
    ),
    [workspaceSlug, projectId]
  );

  const additionalSlashCommandOptions = useMemo<NonNullable<IEditorPropsExtended["additionalSlashCommandOptions"]>>(
    () => [
      {
        commandKey: "page-embed",
        key: "page-embed",
        title: "Page",
        description: "Create and embed a sub-page",
        searchTerms: ["page", "sub-page", "subpage", "document", "doc"],
        icon: <FileText className="size-3.5" />,
        section: "general",
        pushAfter: "code",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          void (async () => {
            try {
              const page = await projectPageService.create(workspaceSlug, projectId, { name: "Untitled" });
              if (!page?.id) return;
              const title = page.name || "Untitled";
              editor
                .chain()
                .focus()
                .insertContent({
                  type: CORE_EXTENSIONS.PAGE_EMBED,
                  attrs: { "data-id": page.id, "data-name": title },
                })
                .run();
              const url = `/${workspaceSlug}/projects/${projectId}/pages/${page.id}`;
              await createLink(workspaceSlug, projectId, issueId, { title, url });
            } catch {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error!",
                message: "The page could not be created. Please try again.",
              });
            }
          })();
        },
      },
    ],
    [workspaceSlug, projectId, issueId, createLink]
  );

  return { pageEmbedWidgetCallback, additionalSlashCommandOptions };
};
