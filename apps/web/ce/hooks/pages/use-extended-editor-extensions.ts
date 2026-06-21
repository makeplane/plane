/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import type { IEditorPropsExtended } from "@plane/editor";
import type { TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
import { buildInternalPageHref, parseInternalPageHref } from "@/helpers/page-links";
import { useAppRouter } from "@/hooks/use-app-router";
import type { TPageInstance } from "@/store/pages/base-page";
import type { EPageStoreType } from "../store";

export type TExtendedEditorExtensionsHookParams = {
  workspaceSlug: string;
  page: TPageInstance;
  storeType: EPageStoreType;
  fetchEntity: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
  getRedirectionLink: (pageId?: string) => string;
  extensionHandlers?: Map<string, unknown>;
  projectId?: string;
};

export type TExtendedEditorExtensionsConfig = IEditorPropsExtended;

export const useExtendedEditorProps = (
  params: TExtendedEditorExtensionsHookParams
): TExtendedEditorExtensionsConfig => {
  const { workspaceSlug, fetchEntity, getRedirectionLink, projectId } = params;
  const router = useAppRouter();

  const buildPageLink = useCallback(
    (pageId: string, targetProjectId?: string) => {
      const resolvedProjectId = targetProjectId ?? projectId;
      if (!resolvedProjectId) {
        return getRedirectionLink(pageId);
      }
      return buildInternalPageHref(workspaceSlug, resolvedProjectId, pageId);
    },
    [getRedirectionLink, projectId, workspaceSlug]
  );

  const searchPages = useCallback(
    async (query: string) => {
      const response = await fetchEntity({
        query,
        query_type: ["page"],
        count: 10,
        project_id: projectId,
      });

      const pages = response.page ?? [];

      return pages
        .filter((page) => Boolean(page.id && page.name))
        .map((page) => ({
          id: page.id as string,
          name: page.name as string,
          logo_props: page.logo_props ?? null,
          project_id:
            (Array.isArray(page.projects__id)
              ? page.projects__id[0]
              : (page.projects__id as unknown as string | undefined)) ??
            projectId ??
            "",
        }));
    },
    [fetchEntity, projectId]
  );

  const onLinkClick = useCallback(
    (href: string, event: MouseEvent) => {
      const internalLink = parseInternalPageHref(href);
      if (!internalLink) {
        return false;
      }

      if (event.metaKey || event.ctrlKey) {
        return false;
      }

      router.push(buildInternalPageHref(workspaceSlug, internalLink.projectId, internalLink.pageId));
      return true;
    },
    [router, workspaceSlug]
  );

  const isInternalPageLink = useCallback((href: string) => Boolean(parseInternalPageHref(href)), []);

  return useMemo(
    () => ({
      onLinkClick,
      isInternalPageLink,
      searchPages,
      buildPageLink,
    }),
    [buildPageLink, isInternalPageLink, onLinkClick, searchPages]
  );
};
