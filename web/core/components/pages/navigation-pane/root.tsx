import { useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRightCircle } from "lucide-react";
import { Tab } from "@headlessui/react";
// hooks
import { useQueryParams } from "@/hooks/use-query-params";
// plane web components
import {
  PAGE_NAVIGATION_PANE_TAB_KEYS,
  TPageNavigationPaneTab,
} from "@/plane-web/components/pages/editor/navigation-pane";
// store
import { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageNavigationPaneTabPanelsRoot } from "./tab-panels/root";
import { PageNavigationPaneTabsList } from "./tabs-list";
import { PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM, PAGE_NAVIGATION_PANE_WIDTH } from "./index";

type Props = {
  handleClose: () => void;
  isNavigationPaneOpen: boolean;
  page: TPageInstance;
};

export const PageNavigationPaneRoot: React.FC<Props> = observer((props) => {
  const { handleClose, isNavigationPaneOpen, page } = props;
  // navigation
  const router = useRouter();
  const searchParams = useSearchParams();
  // query params
  const { updateQueryParams } = useQueryParams();
  // derived values
  const { editorRef } = page;
  const navigationPaneQueryParam = searchParams.get(
    PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM
  ) as TPageNavigationPaneTab | null;
  const activeTab: TPageNavigationPaneTab = navigationPaneQueryParam || "outline";
  const selectedIndex = PAGE_NAVIGATION_PANE_TAB_KEYS.indexOf(activeTab);

  const handleTabChange = useCallback(
    (index: number) => {
      const updatedTab = PAGE_NAVIGATION_PANE_TAB_KEYS[index];
      const updatedRoute = updateQueryParams({
        paramsToAdd: { [PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM]: updatedTab },
      });
      router.push(updatedRoute);
    },
    [router, updateQueryParams]
  );

  return (
    <div
      className="flex-shrink-0 h-full bg-custom-background-100 p-3.5 border-l border-custom-border-200 transition-all duration-300 ease-in-out"
      style={{
        width: `${PAGE_NAVIGATION_PANE_WIDTH}px`,
        marginRight: isNavigationPaneOpen ? "0px" : `-${PAGE_NAVIGATION_PANE_WIDTH}px`,
      }}
    >
      <div className="mb-3.5">
        <button
          type="button"
          className="size-3.5 grid place-items-center text-custom-text-200 hover:text-custom-text-100 transition-colors"
          onClick={handleClose}
        >
          <ArrowRightCircle className="size-3.5" />
        </button>
      </div>
      <Tab.Group selectedIndex={selectedIndex} onChange={handleTabChange}>
        <PageNavigationPaneTabsList />
        <PageNavigationPaneTabPanelsRoot page={page} />
      </Tab.Group>
    </div>
  );
});
