import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRightCircle } from "lucide-react";
import { Tab } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { useQueryParams } from "@/hooks/use-query-params";
// plane web components
import type { TPageNavigationPaneTab } from "@/plane-web/components/pages/navigation-pane";
// store
import type { EPageStoreType } from "@/plane-web/hooks/store";
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import type { TPageRootHandlers } from "../editor/page-root";
import { PageNavigationPaneTabPanelsRoot } from "./tab-panels/root";
import { PageNavigationPaneTabsList } from "./tabs-list";
import type { INavigationPaneExtension } from "./types/extensions";

import {
  PAGE_NAVIGATION_PANE_TAB_KEYS,
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
  const selectedIndex = PAGE_NAVIGATION_PANE_TAB_KEYS.indexOf(activeTab);

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
    (index: number) => {
      const updatedTab = PAGE_NAVIGATION_PANE_TAB_KEYS[index];
      const isUpdatedTabInfo = updatedTab === "info";
      const updatedRoute = updateQueryParams({
        paramsToAdd: { [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM]: updatedTab },
        paramsToRemove: !isUpdatedTabInfo ? [PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM] : undefined,
      });
      router.push(updatedRoute);
    },
    [router, updateQueryParams]
  );

  return (
    <aside
      className="shrink-0 h-full flex flex-col bg-surface-1 pt-3.5 border-l border-subtle transition-all duration-300 ease-out"
      style={{
        width: `${paneWidth}px`,
        marginRight: isNavigationPaneOpen ? "0px" : `-${paneWidth}px`,
      }}
    >
      <div className="mb-3.5 px-3.5">
        <Tooltip tooltipContent={t("page_navigation_pane.close_button")}>
          <button
            type="button"
            className="size-3.5 grid place-items-center text-secondary hover:text-primary transition-colors"
            onClick={handleClose}
            aria-label={t("page_navigation_pane.close_button")}
          >
            <ArrowRightCircle className="size-3.5" />
          </button>
        </Tooltip>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden animate-slide-in-right">
        {ActiveExtension ? (
          <ActiveExtension.component page={page} extensionData={ActiveExtension.data} storeType={storeType} />
        ) : showNavigationTabs ? (
          <Tab.Group as={React.Fragment} selectedIndex={selectedIndex} onChange={handleTabChange}>
            <PageNavigationPaneTabsList />
            <PageNavigationPaneTabPanelsRoot page={page} versionHistory={versionHistory} />
          </Tab.Group>
        ) : null}
      </div>
    </aside>
  );
});
