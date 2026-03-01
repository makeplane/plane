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

import { useCallback, useMemo } from "react";
import type { RefObject } from "react";
import { useSearchParams } from "next/navigation";
import type { EditorRefApi } from "@plane/editor";
import {
  PAGE_NAVIGATION_PANE_TAB_KEYS,
  PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM,
  PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM,
} from "@/components/pages/navigation-pane";
import { useAppRouter } from "@/hooks/use-app-router";
import { useQueryParams } from "@/hooks/use-query-params";
import type { TPageNavigationPaneTab } from "@/plane-web/components/pages/navigation-pane";
import type { INavigationPaneExtension } from "@/types/pages/pane-extensions";
import type { TPageInstance } from "@/store/pages/base-page";

export type TPageExtensionHookParams = {
  page: TPageInstance;
  editorRef: RefObject<EditorRefApi>;
};

export const usePagesPaneExtensions = (_params: TPageExtensionHookParams) => {
  const router = useAppRouter();
  const { updateQueryParams } = useQueryParams();
  const searchParams = useSearchParams();

  // Generic navigation pane logic - hook manages feature-specific routing
  const navigationPaneQueryParam = searchParams.get(
    PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM
  ) as TPageNavigationPaneTab | null;

  const isNavigationPaneOpen =
    !!navigationPaneQueryParam && PAGE_NAVIGATION_PANE_TAB_KEYS.includes(navigationPaneQueryParam);

  const handleOpenNavigationPane = useCallback(() => {
    const updatedRoute = updateQueryParams({
      paramsToAdd: { [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM]: "outline" },
    });
    router.push(updatedRoute);
  }, [router, updateQueryParams]);

  const editorExtensionHandlers: Map<string, unknown> = useMemo(() => {
    const map: Map<string, unknown> = new Map();
    return map;
  }, []);

  const navigationPaneExtensions: INavigationPaneExtension[] = [];

  const handleCloseNavigationPane = useCallback(() => {
    const updatedRoute = updateQueryParams({
      paramsToRemove: [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM, PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM],
    });
    router.push(updatedRoute);
  }, [router, updateQueryParams]);

  return {
    editorExtensionHandlers,
    navigationPaneExtensions,
    handleOpenNavigationPane,
    isNavigationPaneOpen,
    handleCloseNavigationPane,
  };
};
