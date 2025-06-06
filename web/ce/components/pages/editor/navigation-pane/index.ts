export type TPageNavigationPaneTab = "outline" | "info" | "assets";

export const PAGE_NAVIGATION_PANE_TABS_LIST: {
  key: TPageNavigationPaneTab;
  i18n_label: string;
}[] = [
  {
    key: "outline",
    i18n_label: "Outline",
  },
  {
    key: "info",
    i18n_label: "Info",
  },
  {
    key: "assets",
    i18n_label: "Assets",
  },
];

export const PAGE_NAVIGATION_PANE_TAB_KEYS = PAGE_NAVIGATION_PANE_TABS_LIST.map((tab) => tab.key);
