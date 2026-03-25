/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Tab } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
// plane web components
import { ORDERED_PAGE_NAVIGATION_TABS_LIST } from "@/plane-web/components/pages/navigation-pane";

export function PageNavigationPaneTabsList() {
  // translation
  const { t } = useTranslation();

  return (
    <Tab.List className="relative mx-3.5 flex items-center rounded-md bg-layer-3 p-0.5">
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
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-sm bg-layer-3-selected transition-all duration-500 ease-in-out"
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
