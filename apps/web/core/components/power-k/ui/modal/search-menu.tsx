/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";
import { Command } from "cmdk";
import { FileText } from "lucide-react";
import { useParams } from "next/navigation";
// plane imports
import { WORKSPACE_DEFAULT_SEARCH_RESULT } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IWorkspaceSearchResults, TLibraryFile } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
import useDebounce from "@/hooks/use-debounce";
// plane web imports
import { PowerKModalNoSearchResultsCommand } from "@/plane-web/components/command-palette/power-k/search/no-results-command";
import { fileLibraryService } from "@/services/file-library.service";
import { WorkspaceService } from "@/services/workspace.service";
// local imports
import type { TPowerKContext, TPowerKPageType } from "../../core/types";
import { PowerKModalCommandItem } from "./command-item";
import { PowerKModalSearchResults } from "./search-results";
// services init
const workspaceService = new WorkspaceService();

type Props = {
  activePage: TPowerKPageType | null;
  context: TPowerKContext;
  isWorkspaceLevel: boolean;
  searchTerm: string;
  updateSearchTerm: (value: string) => void;
  handleSearchMenuClose?: () => void;
};

export function PowerKModalSearchMenu(props: Props) {
  const { activePage, context, isWorkspaceLevel, searchTerm, updateSearchTerm, handleSearchMenuClose } = props;
  const { t } = useTranslation();
  // states
  const [resultsCount, setResultsCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<IWorkspaceSearchResults>(WORKSPACE_DEFAULT_SEARCH_RESULT);
  const [fileResults, setFileResults] = useState<TLibraryFile[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  // navigation
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { togglePowerKModal } = usePowerK();
  const { isWorkspaceFeatureEnabled } = useWorkspace();
  const isFileLibraryEnabled =
    !!workspaceSlug && isWorkspaceFeatureEnabled(workspaceSlug.toString(), "file_library");

  // File-name search over the workspace library (server-side icontains)
  useEffect(() => {
    if (activePage || !workspaceSlug || !isFileLibraryEnabled) return;
    if (!debouncedSearchTerm) {
      setFileResults([]);
      return;
    }
    let cancelled = false;
    fileLibraryService
      .getFiles(workspaceSlug.toString(), { search: debouncedSearchTerm })
      .then((files) => {
        if (!cancelled) setFileResults(files.slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) setFileResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearchTerm, workspaceSlug, activePage, isFileLibraryEnabled]);

  useEffect(() => {
    if (activePage || !workspaceSlug) return;
    setIsSearching(true);

    if (debouncedSearchTerm) {
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
        .catch(() => {
          setResults(WORKSPACE_DEFAULT_SEARCH_RESULT);
          setResultsCount(0);
        })
        .finally(() => setIsSearching(false));
    } else {
      setResults(WORKSPACE_DEFAULT_SEARCH_RESULT);
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, isWorkspaceLevel, projectId, workspaceSlug, activePage]);

  if (activePage) return null;

  const handleClosePalette = () => {
    handleSearchMenuClose?.();
    togglePowerKModal(false);
  };

  return (
    <>
      {searchTerm.trim() !== "" && (
        <div className="mt-4 flex items-center justify-between gap-2 px-4">
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
      {!isSearching &&
        resultsCount === 0 &&
        fileResults.length === 0 &&
        searchTerm.trim() !== "" &&
        debouncedSearchTerm.trim() !== "" && (
          <PowerKModalNoSearchResultsCommand
            context={context}
            searchTerm={searchTerm}
            updateSearchTerm={updateSearchTerm}
          />
        )}

      {/* Library files matched by name */}
      {searchTerm.trim() !== "" && fileResults.length > 0 && (
        <Command.Group heading={t("file_library.title")}>
          {fileResults.map((file) => (
            <PowerKModalCommandItem
              key={file.id}
              icon={FileText}
              value={`file-${file.id}-${file.attributes?.name ?? ""}`}
              label={file.attributes?.name ?? file.id}
              onSelect={() => {
                handleClosePalette();
                router.push(`/${workspaceSlug}/file-library?preview=${file.id}`);
              }}
            />
          ))}
        </Command.Group>
      )}

      {searchTerm.trim() !== "" && <PowerKModalSearchResults closePalette={handleClosePalette} results={results} />}
    </>
  );
}
