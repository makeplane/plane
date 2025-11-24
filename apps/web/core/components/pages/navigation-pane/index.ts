// plane web imports
import { ORDERED_PAGE_NAVIGATION_TABS_LIST } from "@/plane-web/components/pages/navigation-pane";

export * from "./root";
export * from "./types";

export const PAGE_NAVIGATION_PANE_WIDTH = 294;

export const PAGE_NAVIGATION_PANE_TABS_QUERY_PARAM = "paneTab";
export const PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM = "version";

export const PAGE_NAVIGATION_PANE_TAB_KEYS = ORDERED_PAGE_NAVIGATION_TABS_LIST.map((tab) => tab.key);
