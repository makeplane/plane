"use client";

import React, { useState, useEffect } from "react";
import { Command } from "cmdk";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
// plane imports
import { WORKSPACE_DEFAULT_SEARCH_RESULT } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IWorkspaceSearchResults } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import useDebounce from "@/hooks/use-debounce";
// plane web imports
import { WorkspaceService } from "@/plane-web/services";
// local imports
import type { TPowerKPageType } from "../../core/types";
import { PowerKModalCommandItem } from "./command-item";
import { PowerKModalSearchResults } from "./search-results";
// services init
const workspaceService = new WorkspaceService();

type Props = {
  activePage: TPowerKPageType | null;
  isWorkspaceLevel: boolean;
  searchTerm: string;
  updateSearchTerm: (value: string) => void;
};

export const PowerKModalSearchMenu: React.FC<Props> = (props) => {
  const { activePage, isWorkspaceLevel, searchTerm, updateSearchTerm } = props;
  // states
  const [resultsCount, setResultsCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<IWorkspaceSearchResults>(WORKSPACE_DEFAULT_SEARCH_RESULT);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  // navigation
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { toggleCommandPaletteModal } = useCommandPalette();
  // plane hooks
  const { t } = useTranslation();

  useEffect(() => {
    if (!workspaceSlug) return;
    setIsSearching(true);

    if (debouncedSearchTerm && !activePage) {
      workspaceService
        .searchWorkspace(workspaceSlug.toString(), {
          ...(projectId ? { project_id: projectId.toString() } : {}),
          search: debouncedSearchTerm,
          workspace_search: !projectId ? true : isWorkspaceLevel,
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
      setResults(WORKSPACE_DEFAULT_SEARCH_RESULT);
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, isWorkspaceLevel, projectId, workspaceSlug, activePage]);

  return (
    <>
      {searchTerm.trim() !== "" && (
        <div className="flex items-center justify-between gap-2 mt-4 px-4">
          <h5
            className={cn("text-xs text-custom-text-100", {
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
        <Command.Group>
          <PowerKModalCommandItem
            icon={Search}
            value="no-results"
            label={
              <p className="flex items-center gap-2">
                {t("power_k.search_menu.no_results")}{" "}
                <span className="shrink-0 text-sm text-custom-text-300">{t("power_k.search_menu.clear_search")}</span>
              </p>
            }
            onSelect={() => updateSearchTerm("")}
          />
        </Command.Group>
      )}

      {!activePage && searchTerm.trim() !== "" && (
        <PowerKModalSearchResults closePalette={() => toggleCommandPaletteModal(false)} results={results} />
      )}
    </>
  );
};
