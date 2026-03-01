/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { CloseIcon } from "@plane/propel/icons";

export const RecentSearch = observer(function RecentSearch() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [visibleItems, setVisibleItems] = useState<number>(0);

  useEffect(() => {
    if (recentSearches.length > 0) {
      const timer = setInterval(() => {
        setVisibleItems((prev) => {
          if (prev < recentSearches.length) return prev + 1;
          clearInterval(timer);
          return prev;
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [recentSearches]);

  return (
    <div className="w-full flex flex-col gap-2 py-6">
      {recentSearches.length > 0 && (
        <>
          <div className="flex justify-between text-tertiary">
            <div className="text-13 font-semibold">Recent Searches</div>
            <button className="underline text-11 font-medium">View all</button>
          </div>
          <div className="flex flex-col gap-1">
            {recentSearches.slice(0, visibleItems).map((search) => (
              <button
                className="group flex justify-between text-13 text-primary transition-all duration-300 ease-in-out transform translate-y-0 py-2 rounded-md hover:bg-layer-1 hover:scale-[1.02] hover:px-1"
                key={search}
              >
                <span className="truncate ellipsis w-full group-hover:w-[95%] text-start">{search}</span>
                <CloseIcon className="w-4 h-4 text-placeholder my-auto opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
});
