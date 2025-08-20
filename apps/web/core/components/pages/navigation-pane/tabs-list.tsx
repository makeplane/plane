import { TabsList, TabsTrigger } from "@plane/propel/tabs";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web components
import { ORDERED_PAGE_NAVIGATION_TABS_LIST } from "@/plane-web/components/pages/navigation-pane";

export const PageNavigationPaneTabsList = () => {
  // translation
  const { t } = useTranslation();

  return (
    <TabsList>
      {ORDERED_PAGE_NAVIGATION_TABS_LIST.map((tab) => (
        <TabsTrigger key={tab.key} value={tab.key} type="button">
          {t(tab.i18n_label)}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};
