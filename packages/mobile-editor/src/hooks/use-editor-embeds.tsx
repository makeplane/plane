/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useMemo } from "react";
import type { ExternalEmbedNodeViewProps, TIssueEmbedConfig, TPageEmbedConfig } from "@plane/editor";
// plane types
import type { TPage } from "@plane/types";
// components
import { IssueEmbedCard, IssueEmbedUpgradeCard, PageEmbedCardRoot } from "@/components";
import { EmbedHandler } from "@/components/external-embed/embed-handler";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
// helpers
import { callNative } from "@/helpers";
// store
import { usePages } from "@/hooks/store";
import type { IBasePageStore } from "@/store/base-page.store";
// types
import type { TDocumentEditorParams, TEditorParams } from "@/types/editor";

export type TEmbedHookProps = {
  initialParams: TDocumentEditorParams | TEditorParams | undefined;
  isIssueEmbedEnabled: boolean;
  isNestedPagesEnabled: boolean;
};

export const useEditorEmbeds = (props: TEmbedHookProps) => {
  const { initialParams, isIssueEmbedEnabled, isNestedPagesEnabled } = props;
  const { subPageIds, getSubPageById } = usePages();

  const issueEmbedHandler: TIssueEmbedConfig = useMemo(
    () => ({
      searchCallback: undefined,
      widgetCallback: ({ issueId, projectId, workspaceSlug }) => {
        if (!isIssueEmbedEnabled) return <IssueEmbedUpgradeCard />;
        return <IssueEmbedCard issueId={issueId} projectId={projectId} workspaceSlug={workspaceSlug} />;
      },
    }),
    [isIssueEmbedEnabled]
  );

  const pageEmbedHandler: TPageEmbedConfig | undefined = useMemo(() => {
    if (!initialParams || !(typeof initialParams === "object" && "projectId" in initialParams)) return undefined;

    return {
      widgetCallback: ({ pageId }) => (
        <PageEmbedCardRoot
          pageId={pageId}
          currentUserId={initialParams.currentUserId}
          workspaceSlug={initialParams.workspaceSlug}
          projectId={initialParams.projectId}
          isNestedPagesEnabled={isNestedPagesEnabled}
        />
      ),
      getSubPagesCallback: () => subPageIds,
      getPageDetailsCallback(pageId) {
        const page = getSubPageById(pageId);
        if (!page) throw new Error("Page not found");
        return {
          id: page.id,
          name: page.name,
          archived_at: page.archivedAt,
        } as TPage;
      },

      deletePage: (pageIds) => {
        try {
          const pages = [] as IBasePageStore[];
          for (const pageId of pageIds) {
            const page = getSubPageById(pageId);
            if (page) {
              pages.push(page);
            }
          }
          if (!pages.length) return Promise.resolve();
          return callNative(
            CallbackHandlerStrings.deleteSubPages,
            JSON.stringify({
              workspaceSlug: initialParams.workspaceSlug,
              projectId: initialParams.projectId,
              pages: pages.map((page) =>
                JSON.stringify({
                  id: page.id,
                  logoProps: page.logoProps,
                  name: page.name,
                })
              ),
            })
          ).then(() => undefined);
        } catch (error) {
          console.error("Failed to delete sub pages", error);
          return Promise.resolve();
        }
      },

      archivePage: async (pageId) => {
        await callNative(
          CallbackHandlerStrings.archivePage,
          JSON.stringify({
            pageId: pageId,
            projectId: initialParams.projectId,
            workspaceSlug: initialParams.workspaceSlug,
          })
        );
      },
      unarchivePage: async (pageId) => {
        await callNative(
          CallbackHandlerStrings.restorePage,
          JSON.stringify({
            pageId: pageId,
            projectId: initialParams.projectId,
            workspaceSlug: initialParams.workspaceSlug,
          })
        );
      },
      workspaceSlug: initialParams.workspaceSlug.toString(),
    };
  }, [initialParams, isNestedPagesEnabled, subPageIds, getSubPageById]);

  const embedHandler = useMemo(
    () => ({
      issue: issueEmbedHandler,
      ...(pageEmbedHandler && { page: pageEmbedHandler }),
      externalEmbedComponent: {
        widgetCallback: (props: ExternalEmbedNodeViewProps) => initialParams && <EmbedHandler {...props} />,
      },
    }),
    [issueEmbedHandler, pageEmbedHandler, initialParams]
  );

  return {
    embedHandler,
    pageEmbedHandler,
    issueEmbedHandler,
  };
};
