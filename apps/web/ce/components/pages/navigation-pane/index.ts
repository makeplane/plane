export type TPageNavigationPaneTab = "outline" | "info" | "assets";

export const PAGE_NAVIGATION_PANE_TABS_LIST: Record<
  TPageNavigationPaneTab,
  {
    key: TPageNavigationPaneTab;
    i18n_label: string;
  }
> = {
  outline: {
    key: "outline",
    i18n_label: "page_navigation_pane.tabs.outline.label",
  },
  info: {
    key: "info",
    i18n_label: "page_navigation_pane.tabs.info.label",
  },
  assets: {
    key: "assets",
    i18n_label: "page_navigation_pane.tabs.assets.label",
  },
};

export const ORDERED_PAGE_NAVIGATION_TABS_LIST: {
  key: TPageNavigationPaneTab;
  i18n_label: string;
}[] = [
  PAGE_NAVIGATION_PANE_TABS_LIST.outline,
  PAGE_NAVIGATION_PANE_TABS_LIST.info,
  PAGE_NAVIGATION_PANE_TABS_LIST.assets,
];
