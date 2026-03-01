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

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ArrowUpToLine, Clipboard, History } from "lucide-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
import { copyTextToClipboard } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { usePageFilters } from "@/hooks/use-page-filters";
import { useQueryParams } from "@/hooks/use-query-params";
// plane web imports
import type { TPageNavigationPaneTab } from "@/plane-web/components/pages/navigation-pane";
import type { EPageStoreType } from "@/plane-web/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageActions } from "../../dropdowns";
import { ExportPageModal } from "../../modals/export-page-modal";
import { PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM } from "../../navigation-pane";

type Props = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageOptionsDropdown = observer(function PageOptionsDropdown(props: Props) {
  const { page, storeType } = props;
  // states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  // navigation
  const router = useAppRouter();
  // store values
  const {
    name,
    isContentEditable,
    editor: { editorRef },
  } = page;
  // page filters
  const { isFullWidth, handleFullWidth, isStickyToolbarEnabled, handleStickyToolbar } = usePageFilters();
  // query params
  const { updateQueryParams } = useQueryParams();
  // menu items list
  const EXTRA_MENU_OPTIONS = useMemo(
    function EXTRA_MENU_OPTIONS(): React.ComponentProps<typeof PageActions>["extraOptions"] {
      return [
        {
          key: "full-screen",
          action: () => handleFullWidth(!isFullWidth),
          customContent: (
            <>
              Full width
              <Switch value={isFullWidth} onChange={() => {}} />
            </>
          ),
          className: "flex items-center justify-between gap-2",
        },
        {
          key: "sticky-toolbar",
          action: () => handleStickyToolbar(!isStickyToolbarEnabled),
          customContent: (
            <>
              Sticky toolbar
              <Switch value={isStickyToolbarEnabled} onChange={() => {}} />
            </>
          ),
          className: "flex items-center justify-between gap-2",
          shouldRender: isContentEditable,
        },
        {
          key: "copy-markdown",
          action: () => {
            if (!editorRef) return;
            editorRef.copyMarkdownToClipboard();
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Markdown copied to clipboard.",
            });
          },
          title: "Copy markdown",
          icon: Clipboard,
          shouldRender: true,
        },
        {
          key: "version-history",
          action: () => {
            // update query param to show info tab in navigation pane
            const updatedRoute = updateQueryParams({
              paramsToAdd: {
                [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM]: "info" satisfies TPageNavigationPaneTab,
              },
            });
            router.push(updatedRoute);
          },
          title: "Version history",
          icon: History,
          shouldRender: true,
        },
        {
          key: "export",
          action: () => setIsExportModalOpen(true),
          title: "Export",
          icon: ArrowUpToLine,
          shouldRender: true,
        },
      ];
    },
    [
      handleFullWidth,
      isFullWidth,
      handleStickyToolbar,
      isStickyToolbarEnabled,
      isContentEditable,
      editorRef,
      updateQueryParams,
      router,
      setIsExportModalOpen,
    ]
  );

  return (
    <>
      <ExportPageModal
        key={page.id}
        editorRef={editorRef}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        pageTitle={name ?? ""}
        pageId={page.id ?? ""}
        teamspaceId={page.team ?? undefined}
      />
      <PageActions
        extraOptions={EXTRA_MENU_OPTIONS}
        optionsOrder={[
          "full-screen",
          "sticky-toolbar",
          "copy-markdown",
          "version-history",
          "make-a-copy",
          "archive-restore",
          "delete",
          "toggle-access",
          "export",
        ]}
        page={page}
        storeType={storeType}
      />
    </>
  );
});
