// plane imports
import { useTranslation } from "@plane/i18n";
import { Tabs } from "@plane/propel/tabs";
// plane web components
import { ORDERED_PAGE_NAVIGATION_TABS_LIST } from "@/plane-web/components/pages/navigation-pane";

export function PageNavigationPaneTabsList() {
  // translation
  const { t } = useTranslation();

  return (
    <div className="mx-3.5">
      <Tabs.List className="relative flex items-center p-[2px] rounded-md bg-custom-background-80">
        {ORDERED_PAGE_NAVIGATION_TABS_LIST.map((tab) => (
          <Tabs.Trigger
            key={tab.key}
            value={tab.key}
            className="relative z-[1] flex-1 py-1.5 text-sm font-semibold outline-none"
          >
            {t(tab.i18n_label)}
          </Tabs.Trigger>
        ))}
        <Tabs.Indicator className="absolute top-1/2 -translate-y-1/2 bg-custom-background-90 rounded transition-all duration-500 ease-in-out pointer-events-none" />
      </Tabs.List>
    </div>
  );
}
