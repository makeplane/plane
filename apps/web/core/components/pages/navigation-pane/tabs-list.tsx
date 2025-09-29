import { useTranslation } from "@plane/i18n";
import { Tabs } from "@plane/propel/tabs";
// plane imports
// plane web components
import { ORDERED_PAGE_NAVIGATION_TABS_LIST } from "@/plane-web/components/pages/navigation-pane";

export const PageNavigationPaneTabsList = () => {
  // translation
  const { t } = useTranslation();

  return (
    <Tabs.List aria-label="Page navigation tabs">
      {ORDERED_PAGE_NAVIGATION_TABS_LIST.map((tab) => (
        <Tabs.Trigger key={tab.key} value={tab.key} type="button">
          {t(tab.i18n_label)}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  );
};
