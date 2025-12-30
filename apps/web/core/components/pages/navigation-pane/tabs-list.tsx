// plane imports
import { useTranslation } from "@plane/i18n";
import { Tabs } from "@plane/propel/tabs";
// plane web components
import { ORDERED_PAGE_NAVIGATION_TABS_LIST } from "@/plane-web/components/pages/navigation-pane";

export function PageNavigationPaneTabsList() {
  // translation
  const { t } = useTranslation();

  return (
    <Tabs.List>
      {ORDERED_PAGE_NAVIGATION_TABS_LIST.map((tab) => (
        <Tabs.Trigger key={tab.key} value={tab.key}>
          {t(tab.i18n_label)}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  );
}
