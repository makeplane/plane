import { Tab } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web components
import { ORDERED_PAGE_NAVIGATION_TABS_LIST } from "@/plane-web/components/pages/navigation-pane";

export function PageNavigationPaneTabsList() {
  // translation
  const { t } = useTranslation();

  return (
    <Tab.List className="relative flex items-center p-0.5 rounded-md bg-layer-3 mx-3.5">
      {({ selectedIndex }) => (
        <>
          {ORDERED_PAGE_NAVIGATION_TABS_LIST.map((tab) => (
            <Tab
              key={tab.key}
              type="button"
              className="relative z-[1] flex-1 py-1.5 text-13 font-semibold outline-none"
            >
              {t(tab.i18n_label)}
            </Tab>
          ))}
          {/* active tab indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 bg-layer-3-selected rounded-sm transition-all duration-500 ease-in-out pointer-events-none"
            style={{
              left: `calc(${(selectedIndex / ORDERED_PAGE_NAVIGATION_TABS_LIST.length) * 100}% + 2px)`,
              height: "calc(100% - 4px)",
              width: `calc(${100 / ORDERED_PAGE_NAVIGATION_TABS_LIST.length}% - 4px)`,
            }}
          />
        </>
      )}
    </Tab.List>
  );
}
