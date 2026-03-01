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

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Checkbox } from "@plane/ui";
// components
import type { TPageRootHandlers } from "@/components/pages/editor/page-root";
// hooks
import { useQueryParams } from "@/hooks/use-query-params";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageNavigationPaneInfoTabActorsInfo } from "./actors-info";
import { PageNavigationPaneInfoTabDocumentInfo } from "./document-info";
import { PageNavigationPaneInfoTabVersionHistory } from "./version-history";
import { PAGE_NAVIGATION_PANE_HIGHLIGHT_CHANGES_QUERY_PARAM, PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM } from "../..";

type Props = {
  page: TPageInstance;
  versionHistory: Pick<TPageRootHandlers, "fetchAllVersions" | "fetchVersionDetails">;
};

export const PageNavigationPaneInfoTabPanel = observer(function PageNavigationPaneInfoTabPanel(props: Props) {
  const { page, versionHistory } = props;
  // navigation
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeVersion = searchParams.get(PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM);
  const highlightChangesParam = searchParams.get(PAGE_NAVIGATION_PANE_HIGHLIGHT_CHANGES_QUERY_PARAM);
  const highlightChanges = highlightChangesParam !== "false";
  // translation
  const { t } = useTranslation();
  // query params
  const { updateQueryParams } = useQueryParams();

  const handleHighlightChangesToggle = useCallback(() => {
    const newValue = !highlightChanges;
    const updatedRoute = updateQueryParams({
      paramsToAdd: newValue ? undefined : { [PAGE_NAVIGATION_PANE_HIGHLIGHT_CHANGES_QUERY_PARAM]: "false" },
      paramsToRemove: newValue ? [PAGE_NAVIGATION_PANE_HIGHLIGHT_CHANGES_QUERY_PARAM] : undefined,
    });
    router.push(updatedRoute);
  }, [highlightChanges, updateQueryParams, router]);

  return (
    <div className="flex flex-col h-full px-4">
      <div className="flex-1 overflow-y-auto mt-5">
        <PageNavigationPaneInfoTabDocumentInfo page={page} />
        <PageNavigationPaneInfoTabActorsInfo page={page} />
        <div className="flex-shrink-0 h-px bg-layer-1 my-3" />
        <PageNavigationPaneInfoTabVersionHistory page={page} versionHistory={versionHistory} />
      </div>
      {/* Fixed checkbox at bottom */}
      {activeVersion && (
        <div className="flex-shrink-0 py-3 border-t border-subtle bg-surface-1">
          <label className="flex items-center gap-2 text-11 font-medium text-primary cursor-pointer">
            <Checkbox checked={highlightChanges} onChange={handleHighlightChangesToggle} />
            <span>{t("page_navigation_pane.tabs.info.version_history.highlight_changes")}</span>
          </label>
        </div>
      )}
    </div>
  );
});
