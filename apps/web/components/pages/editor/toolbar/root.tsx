/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { RightSidePaneOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// components
import { PageToolbar } from "@/components/pages/editor/toolbar";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  handleOpenNavigationPane: () => void;
  isNavigationPaneOpen: boolean;
  page: TPageInstance;
};

export const PageEditorToolbarRoot = observer(function PageEditorToolbarRoot(props: Props) {
  const { handleOpenNavigationPane, isNavigationPaneOpen, page } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const {
    isContentEditable,
    editor: { editorRef },
  } = page;
  // page filters
  const { isStickyToolbarEnabled } = usePageFilters();
  // derived values
  const shouldHideToolbar = !isStickyToolbarEnabled || !isContentEditable;

  return (
    <>
      <div
        id="page-toolbar-container"
        className={cn("max-h-[52px] overflow-hidden transition-all duration-300 ease-linear", {
          "border-b border-subtle": !shouldHideToolbar,
          "max-h-0": shouldHideToolbar,
        })}
      >
        <div className="relative hidden min-h-[52px] items-center px-page-x transition-opacity duration-200 ease-in-out md:flex">
          <div className="flex w-full max-w-full items-center justify-between">
            <div className="flex-1">{editorRef && <PageToolbar editorRef={editorRef} />}</div>
            <div className="flex -translate-y-px items-center gap-2">
              {!isNavigationPaneOpen && (
                <IconButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  showTooltip={false}
                  onClick={handleOpenNavigationPane}
                  aria-label={t("page_navigation_pane.open_button")}
                  icon={<Icon icon={RightSidePaneOutline} />}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {shouldHideToolbar && (
        <div className="absolute top-3 right-0 z-10 flex h-6 items-center px-page-x">
          {!isNavigationPaneOpen && (
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleOpenNavigationPane}
              aria-label={t("page_navigation_pane.open_button")}
              icon={<Icon icon={RightSidePaneOutline} />}
            />
          )}
        </div>
      )}
    </>
  );
});
