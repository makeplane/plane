import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRightCircle } from "lucide-react";
import { Tab } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/ui";
// hooks
import { useQueryParams } from "@/hooks/use-query-params";
// plane web components
import { TPageNavigationPaneTab } from "@/plane-web/components/pages/navigation-pane";
// store
import { TPageInstance } from "@/store/pages/base-page";
// local imports
import { TPageRootHandlers } from "../editor";
import { PageNavigationPaneTabPanelsRoot } from "./tab-panels/root";
import { PageNavigationPaneTabsList } from "./tabs-list";
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
};

export const PageNavigationPaneRoot: React.FC<Props> = observer((props) => {
  const { handleClose, isNavigationPaneOpen, page, versionHistory } = props;
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
      className="flex-shrink-0 h-full flex flex-col bg-custom-background-100 pt-3.5 border-l border-custom-border-200 transition-all duration-300 ease-in-out"
      style={{
        width: `${PAGE_NAVIGATION_PANE_WIDTH}px`,
        marginRight: isNavigationPaneOpen ? "0px" : `-${PAGE_NAVIGATION_PANE_WIDTH}px`,
      }}
    >
      <div className="mb-3.5 px-3.5">
        <Tooltip tooltipContent={t("page_navigation_pane.close_button")}>
          <button
            type="button"
            className="size-3.5 grid place-items-center text-custom-text-200 hover:text-custom-text-100 transition-colors"
            onClick={handleClose}
            aria-label={t("page_navigation_pane.close_button")}
          >
            <ArrowRightCircle className="size-3.5" />
          </button>
        </Tooltip>
      </div>
      <Tab.Group as={React.Fragment} selectedIndex={selectedIndex} onChange={handleTabChange}>
        <PageNavigationPaneTabsList />
        <PageNavigationPaneTabPanelsRoot page={page} versionHistory={versionHistory} />
      </Tab.Group>
    </aside>
  );
});
