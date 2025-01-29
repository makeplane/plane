"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { IWorkspaceSearchResults, TPowerKPageKeys } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useCommandPalette } from "@/hooks/store";
import useDebounce from "@/hooks/use-debounce";
// plane web constants
import { POWER_K_PLACEHOLDER_TEXT, PowerKContextBasedActions } from "@/plane-web/components/command-palette/power-k";
// plane web services
import { WorkspaceService } from "@/plane-web/services";
// local components
import { PowerKBreadcrumbs } from "./breadcrumbs";
import { PowerKCreateActionsMenu } from "./create-menu";
import { PowerKHelpMenu } from "./help-menu";
import { PowerKLoader } from "./loader";
import { PowerKNavigationMenu } from "./navigation-menu";
import { PowerKPersonalizationMenu } from "./personalization";
import { PowerKSearchInput } from "./search-input";
import { PowerKSearchResults } from "./search-results";
import { PowerKSettingsMenu } from "./settings";

const workspaceService = new WorkspaceService();

export const PowerKModal: React.FC = observer(() => {
  // states
  const [resultsCount, setResultsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<IWorkspaceSearchResults>({
    results: {
      workspace: [],
      project: [],
      issue: [],
      cycle: [],
      module: [],
      issue_view: [],
      page: [],
    },
  });
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);
  const [pages, setPages] = useState<TPowerKPageKeys[]>([]);
  const { isCommandPaletteOpen, toggleCommandPaletteModal } = useCommandPalette();
  // router params
  const { workspaceSlug, projectId } = useParams();
  // debounce
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const activePage = pages.length > 0 ? pages[pages.length - 1] : undefined;

  const handleClose = () => {
    toggleCommandPaletteModal(false);
    setTimeout(() => {
      setSearchTerm("");
      setPages([]);
    }, 300);
  };

  const handleUpdatePage = useCallback((page: TPowerKPageKeys) => setPages((prev) => [...prev, page]), []);
  const handleUpdateSearchTerm = useCallback((searchTerm: string) => setSearchTerm(searchTerm), []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // when search term is not empty, esc should clear the search term
    if (e.key === "Escape" && searchTerm) setSearchTerm("");

    // when user tries to close the modal with esc
    if (e.key === "Escape" && !activePage && !searchTerm) handleClose();

    // Escape goes to previous page
    // Backspace goes to previous page when search is empty
    if (e.key === "Escape" || (e.key === "Backspace" && !searchTerm)) {
      e.preventDefault();
      setPages((pages) => pages.slice(0, -1));
    }
  };

  // search handler
  useEffect(
    () => {
      if (!workspaceSlug) return;

      setIsLoading(true);

      if (debouncedSearchTerm) {
        setIsSearching(true);
        workspaceService
          .searchWorkspace(workspaceSlug.toString(), {
            ...(projectId ? { project_id: projectId.toString() } : {}),
            search: debouncedSearchTerm,
            workspace_search: !projectId ? true : isWorkspaceLevel,
          })
          .then((results) => {
            setResults(results);
            const count = Object.keys(results.results).reduce(
              (accumulator, key) => results.results[key as keyof typeof results.results].length + accumulator,
              0
            );
            setResultsCount(count);
          })
          .finally(() => {
            setIsLoading(false);
            setIsSearching(false);
          });
      } else {
        setResults({
          results: {
            workspace: [],
            project: [],
            issue: [],
            cycle: [],
            module: [],
            issue_view: [],
            page: [],
          },
        });
        setIsLoading(false);
        setIsSearching(false);
      }
    },
    [debouncedSearchTerm, isWorkspaceLevel, projectId, workspaceSlug] // Only call effect if debounced search term changes
  );

  return (
    <ModalCore
      isOpen={isCommandPaletteOpen}
      handleClose={handleClose}
      position={EModalPosition.TOP}
      width={EModalWidth.XXL}
    >
      <div className="w-full max-w-2xl">
        <Command
          filter={(value, search) => {
            if (value.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
          onKeyDown={handleKeyDown}
        >
          <PowerKBreadcrumbs />
          <PowerKSearchInput
            handleUpdateSearchTerm={setSearchTerm}
            isWorkspaceLevel={isWorkspaceLevel}
            placeholder={POWER_K_PLACEHOLDER_TEXT[activePage ?? "default"]}
            searchTerm={searchTerm}
            toggleWorkspaceLevel={() => setIsWorkspaceLevel((prev) => !prev)}
          />
          <Command.List className="vertical-scrollbar scrollbar-sm max-h-96 overflow-scroll p-2">
            {searchTerm !== "" && (
              <h5 className="mx-[3px] my-4 text-xs text-custom-text-100">
                Search results for{" "}
                <span className="font-medium">
                  {'"'}
                  {searchTerm}
                  {'"'}
                </span>{" "}
                in {!projectId || isWorkspaceLevel ? "workspace" : "project"}:
              </h5>
            )}
            {!isLoading && resultsCount === 0 && searchTerm !== "" && debouncedSearchTerm !== "" && (
              <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
                <EmptyState type={EmptyStateType.COMMAND_K_SEARCH_EMPTY_STATE} layout="screen-simple" />
              </div>
            )}
            {(isLoading || isSearching) && <PowerKLoader />}
            {debouncedSearchTerm !== "" && <PowerKSearchResults handleClose={handleClose} results={results} />}
            <PowerKContextBasedActions
              handleClose={handleClose}
              activePage={activePage}
              handleUpdatePage={handleUpdatePage}
              handleUpdateSearchTerm={handleUpdateSearchTerm}
            />
            {!activePage && <PowerKNavigationMenu handleClose={handleClose} />}
            {!activePage && <PowerKCreateActionsMenu handleClose={handleClose} />}
            <PowerKSettingsMenu
              activePage={activePage}
              handleClose={handleClose}
              handleUpdateSearchTerm={handleUpdateSearchTerm}
              handleUpdatePage={handleUpdatePage}
            />
            <PowerKPersonalizationMenu
              activePage={activePage}
              handleClose={handleClose}
              handleUpdateSearchTerm={handleUpdateSearchTerm}
              handleUpdatePage={handleUpdatePage}
            />
            {!activePage && <PowerKHelpMenu handleClose={handleClose} />}
          </Command.List>
        </Command>
      </div>
    </ModalCore>
  );
});
