/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowNarrowRightOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Tabs } from "@makeplane/propel/components/tabs";
// hooks
import { useQueryParams } from "@/hooks/use-query-params";
// plane web components
import type { TPageNavigationPaneTab } from "@/components/pages/navigation-pane/tab-panels";
// store
import type { EPageStoreType } from "@/hooks/store";
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import type { TPageRootHandlers } from "../editor/page-root";
import { PageNavigationPaneTabPanelsRoot } from "./tab-panels/root";
import { PageNavigationPaneVersionHistoryPanel } from "./tab-panels/version-history";
import { PageNavigationPaneTabsList } from "./tabs-list";
import type { INavigationPaneExtension } from "./types/extensions";

import {
  PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM,
  PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM,
  PAGE_NAVIGATION_PANE_WIDTH,
} from "./index";

type Props = {
  handleClose: () => void;
  isNavigationPaneOpen: boolean;
  page: TPageInstance;
  versionHistory: Pick<TPageRootHandlers, "fetchAllVersions" | "fetchVersionDetails">;
  // Generic extension system for additional navigation pane content
  extensions?: INavigationPaneExtension[];
  storeType: EPageStoreType;
};

export const PageNavigationPaneRoot = observer(function PageNavigationPaneRoot(props: Props) {
  const { handleClose, isNavigationPaneOpen, page, versionHistory, extensions = [], storeType } = props;

  // navigation
  const router = useRouter();
  const searchParams = useSearchParams();
  // query params
  const { updateQueryParams } = useQueryParams();
  // derived values
  const navigationPaneQueryParam = searchParams.get(
    PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM
  ) as TPageNavigationPaneTab | null;
  const activeTab: TPageNavigationPaneTab = navigationPaneQueryParam || "outline";
  const isVersionHistoryOpen = activeTab === "version_history";

  // Check if any extension is currently active based on query parameters
  const ActiveExtension = extensions.find((extension) => {
    const paneTabValue = searchParams.get(PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM);
    const hasVersionParam = searchParams.get(PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM);

    // Extension is active ONLY when paneTab matches AND no regular navigation params are present
    return paneTabValue === extension.triggerParam && !hasVersionParam;
  });

  // Don't show tabs when an extension is active
  const showNavigationTabs = !ActiveExtension && isNavigationPaneOpen;

  // Use extension width if available, otherwise fall back to default
  const paneWidth = ActiveExtension?.width ?? PAGE_NAVIGATION_PANE_WIDTH;
  // translation
  const { t } = useTranslation();

  const handleTabChange = useCallback(
    (value: string) => {
      const updatedTab = value as TPageNavigationPaneTab;
      const updatedRoute = updateQueryParams({
        paramsToAdd: { [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM]: updatedTab },
        paramsToRemove: [PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM],
      });
      router.push(updatedRoute);
    },
    [router, updateQueryParams]
  );

  return (
    <aside
      className="flex h-full shrink-0 flex-col border-l border-subtle bg-surface-1 pt-3.5 transition-all duration-300 ease-out"
      style={{
        width: `${paneWidth}px`,
        marginRight: isNavigationPaneOpen ? "0px" : `-${paneWidth}px`,
      }}
    >
      {/* version history renders its own title row with the close control */}
      {!(isVersionHistoryOpen && showNavigationTabs) && (
        <div className="mb-3.5 px-3.5">
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Icon icon={ArrowNarrowRightOutline} />}
            onClick={handleClose}
            aria-label={t("page_navigation_pane.close_button")}
          />
        </div>
      )}

      <div className="animate-slide-in-right flex flex-1 flex-col overflow-hidden">
        {ActiveExtension ? (
          <ActiveExtension.component page={page} extensionData={ActiveExtension.data} storeType={storeType} />
        ) : showNavigationTabs && isVersionHistoryOpen ? (
          <PageNavigationPaneVersionHistoryPanel
            handleClose={handleClose}
            page={page}
            versionHistory={versionHistory}
          />
        ) : showNavigationTabs ? (
          <Tabs variant="contained" stretch="full" layout="fill" value={activeTab} onValueChange={handleTabChange}>
            <div className="flex h-full w-full flex-col">
              <PageNavigationPaneTabsList />
              <PageNavigationPaneTabPanelsRoot page={page} />
            </div>
          </Tabs>
        ) : null}
      </div>
    </aside>
  );
});
