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

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
// plane imports
import { cn } from "@plane/utils";
// components
import type { TPowerKContext, TPowerKPageType } from "@/components/power-k/core/types";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
import useDebounce from "@/hooks/use-debounce";
// plane web imports
import { PowerKModalNoSearchResultsCommand } from "@/components/command-palette/power-k/search/no-results-command";
import { AppService } from "@/services/app.service";
import type { IAppSearchResults } from "@/types";
// local imports
import { WikiAppPowerKModalSearchResults } from "./search-results";
// services init
const appService = new AppService();

type Props = {
  activePage: TPowerKPageType | null;
  context: TPowerKContext;
  isWorkspaceLevel: boolean;
  searchTerm: string;
  updateSearchTerm: (value: string) => void;
};

export function WikiAppPowerKModalSearchMenu(props: Props) {
  const { activePage, context, isWorkspaceLevel, searchTerm, updateSearchTerm } = props;
  // states
  const [resultsCount, setResultsCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<IAppSearchResults>({
    results: {
      workspace: [],
      page: [],
    },
  });
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  // navigation
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { togglePowerKModal } = usePowerK();

  useEffect(() => {
    if (activePage || !workspaceSlug) return;
    setIsSearching(true);

    if (debouncedSearchTerm) {
      appService
        .searchApp(workspaceSlug.toString(), {
          search: debouncedSearchTerm,
        })
        .then((results) => {
          setResults(results);
          const count = Object.keys(results.results).reduce(
            (accumulator, key) => results.results[key as keyof typeof results.results]?.length + accumulator,
            0
          );
          setResultsCount(count);
        })
        .finally(() => setIsSearching(false));
    } else {
      setResults({
        results: {
          workspace: [],
          page: [],
        },
      });
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, isWorkspaceLevel, projectId, workspaceSlug, activePage]);

  if (activePage) return null;

  return (
    <>
      {searchTerm.trim() !== "" && (
        <div className="flex items-center justify-between gap-2 mt-4 px-4">
          <h5
            className={cn("text-11 text-primary", {
              "animate-pulse": isSearching,
            })}
          >
            Search results for{" "}
            <span className="font-medium">
              {'"'}
              {searchTerm}
              {'"'}
            </span>{" "}
            in {isWorkspaceLevel ? "workspace" : "project"}:
          </h5>
        </div>
      )}

      {/* Show empty state only when not loading and no results */}
      {!isSearching && resultsCount === 0 && searchTerm.trim() !== "" && debouncedSearchTerm.trim() !== "" && (
        <PowerKModalNoSearchResultsCommand
          context={context}
          searchTerm={searchTerm}
          updateSearchTerm={updateSearchTerm}
        />
      )}

      {searchTerm.trim() !== "" && (
        <WikiAppPowerKModalSearchResults closePalette={() => togglePowerKModal(false)} results={results} />
      )}
    </>
  );
}
