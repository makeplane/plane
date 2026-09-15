/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
// plane editor
import type { TPageEmbedSection } from "@plane/editor";
// plane types
import type { TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
// plane ui
import { Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon } from "@plane/propel/icons";

type TArgs = {
  workspaceSlug: string;
  projectId: string | undefined;
  // the page being edited, never suggested as an embed of itself
  excludePageId?: string;
  searchEntity: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
};

export const useEditorPageEmbed = (args: TArgs) => {
  const { workspaceSlug, projectId, excludePageId, searchEntity } = args;

  const fetchPageSuggestions = useCallback(
    async (query: string): Promise<TPageEmbedSection[]> => {
      if (!projectId) return [];
      try {
        const res = await searchEntity({
          count: 10,
          query_type: ["page"],
          query,
          project_id: projectId,
        });
        const pages = res?.page ?? [];
        return [
          {
            key: "pages",
            title: "Pages",
            items: pages
              .filter((page): page is typeof page & { id: string } => !!page.id && page.id !== excludePageId)
              .map((page) => ({
              id: page.id,
              entity_identifier: page.id,
              project_identifier: projectId,
              workspace_identifier: workspaceSlug,
              title: page.name || "Untitled",
              icon: page.logo_props?.in_use ? (
                <Logo logo={page.logo_props} size={14} type="lucide" />
              ) : (
                <PageIcon className="size-3.5 text-tertiary" />
              ),
            })),
          },
        ];
      } catch (error) {
        console.error("Error in fetching page suggestions:", error);
        throw error;
      }
    },
    [excludePageId, projectId, searchEntity, workspaceSlug]
  );

  return {
    fetchPageSuggestions,
  };
};
