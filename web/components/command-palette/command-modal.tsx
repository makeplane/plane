import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { FolderPlus, Search, Settings } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// icons
import { IWorkspaceSearchResults } from "@plane/types";
// hooks
import { LayersIcon, Loader, ToggleSwitch, Tooltip } from "@plane/ui";
import {
  CommandPaletteThemeActions,
  ChangeIssueAssignee,
  ChangeIssuePriority,
  ChangeIssueState,
  CommandPaletteHelpActions,
  CommandPaletteIssueActions,
  CommandPaletteProjectActions,
  CommandPaletteWorkspaceSettingsActions,
  CommandPaletteSearchResults,
} from "@/components/command-palette";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateType } from "@/constants/empty-state";
import { ISSUE_DETAILS } from "@/constants/fetch-keys";
import { useCommandPalette, useEventTracker, useProject } from "@/hooks/store";
import useDebounce from "@/hooks/use-debounce";
import { usePlatformOS } from "@/hooks/use-platform-os";
// services
import { IssueService } from "@/services/issue";
import { WorkspaceService } from "@/services/workspace.service";
// ui
// components
// types
// fetch-keys
// constants

const workspaceService = new WorkspaceService();
const issueService = new IssueService();

export const CommandModal: React.FC = observer(() => {
  // hooks
  const { getProjectById, workspaceProjectIds } = useProject();
  const { isMobile } = usePlatformOS();
  // states
  const [placeholder, setPlaceholder] = useState("Type a command or search...");
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
  const [pages, setPages] = useState<string[]>([]);
  const { isCommandPaletteOpen, toggleCommandPaletteModal, toggleCreateIssueModal, toggleCreateProjectModal } =
    useCommandPalette();
  const { setTrackElement } = useEventTracker();

  // router
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const page = pages[pages.length - 1];

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // TODO: update this to mobx store
  const { data: issueDetails } = useSWR(
    workspaceSlug && projectId && issueId ? ISSUE_DETAILS(issueId.toString()) : null,
    workspaceSlug && projectId && issueId
      ? () => issueService.retrieve(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      : null
  );

  const closePalette = () => {
    toggleCommandPaletteModal(false);
  };

  const createNewWorkspace = () => {
    closePalette();
    router.push("/create-workspace");
  };

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
              (accumulator, key) => (results.results as any)[key].length + accumulator,
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

  const projectDetails = getProjectById(issueDetails?.project_id ?? "");

  return (
    <Transition.Root show={isCommandPaletteOpen} afterLeave={() => setSearchTerm("")} as={React.Fragment}>
      <Dialog as="div" className="relative z-30" onClose={() => closePalette()}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-30 overflow-y-auto">
          <div className="flex items-center justify-center p-4 sm:p-6 md:p-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative flex w-full max-w-2xl transform items-center justify-center divide-y divide-custom-border-200 divide-opacity-10 rounded-lg bg-custom-background-100 shadow-custom-shadow-md transition-all">
                <div className="w-full max-w-2xl">
                  <Command
                    filter={(value, search) => {
                      if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                      return 0;
                    }}
                    onKeyDown={(e) => {
                      // when search term is not empty, esc should clear the search term
                      if (e.key === "Escape" && searchTerm) setSearchTerm("");

                      // when user tries to close the modal with esc
                      if (e.key === "Escape" && !page && !searchTerm) closePalette();

                      // Escape goes to previous page
                      // Backspace goes to previous page when search is empty
                      if (e.key === "Escape" || (e.key === "Backspace" && !searchTerm)) {
                        e.preventDefault();
                        setPages((pages) => pages.slice(0, -1));
                        setPlaceholder("Type a command or search...");
                      }
                    }}
                  >
                    <div
                      className={`flex gap-4 p-3 pb-0 sm:items-center ${
                        issueDetails ? "flex-col justify-between sm:flex-row" : "justify-end"
                      }`}
                    >
                      {issueDetails && (
                        <div className="overflow-hidden truncate rounded-md bg-custom-background-80 p-2 text-xs font-medium text-custom-text-200">
                          {projectDetails?.identifier}-{issueDetails.sequence_id} {issueDetails.name}
                        </div>
                      )}
                      {projectId && (
                        <Tooltip tooltipContent="Toggle workspace level search" isMobile={isMobile}>
                          <div className="flex flex-shrink-0 cursor-pointer items-center gap-1 self-end text-xs sm:self-center">
                            <button
                              type="button"
                              onClick={() => setIsWorkspaceLevel((prevData) => !prevData)}
                              className="flex-shrink-0"
                            >
                              Workspace Level
                            </button>
                            <ToggleSwitch
                              value={isWorkspaceLevel}
                              onChange={() => setIsWorkspaceLevel((prevData) => !prevData)}
                            />
                          </div>
                        </Tooltip>
                      )}
                    </div>
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-custom-text-200"
                        aria-hidden="true"
                        strokeWidth={2}
                      />
                      <Command.Input
                        className="w-full border-0 border-b border-custom-border-200 bg-transparent p-4 pl-11 text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400 focus:ring-0"
                        placeholder={placeholder}
                        value={searchTerm}
                        onValueChange={(e) => setSearchTerm(e)}
                        autoFocus
                        tabIndex={1}
                      />
                    </div>

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

                      {(isLoading || isSearching) && (
                        <Command.Loading>
                          <Loader className="space-y-3">
                            <Loader.Item height="40px" />
                            <Loader.Item height="40px" />
                            <Loader.Item height="40px" />
                            <Loader.Item height="40px" />
                          </Loader>
                        </Command.Loading>
                      )}

                      {debouncedSearchTerm !== "" && (
                        <CommandPaletteSearchResults closePalette={closePalette} results={results} />
                      )}

                      {!page && (
                        <>
                          {/* issue actions */}
                          {issueId && (
                            <CommandPaletteIssueActions
                              closePalette={closePalette}
                              issueDetails={issueDetails}
                              pages={pages}
                              setPages={(newPages) => setPages(newPages)}
                              setPlaceholder={(newPlaceholder) => setPlaceholder(newPlaceholder)}
                              setSearchTerm={(newSearchTerm) => setSearchTerm(newSearchTerm)}
                            />
                          )}
                          {workspaceSlug && workspaceProjectIds && workspaceProjectIds.length > 0 && (
                            <Command.Group heading="Issue">
                              <Command.Item
                                onSelect={() => {
                                  closePalette();
                                  setTrackElement("Command Palette");
                                  toggleCreateIssueModal(true);
                                }}
                                className="focus:bg-custom-background-80"
                              >
                                <div className="flex items-center gap-2 text-custom-text-200">
                                  <LayersIcon className="h-3.5 w-3.5" />
                                  Create new issue
                                </div>
                                <kbd>C</kbd>
                              </Command.Item>
                            </Command.Group>
                          )}

                          {workspaceSlug && (
                            <Command.Group heading="Project">
                              <Command.Item
                                onSelect={() => {
                                  closePalette();
                                  setTrackElement("Command palette");
                                  toggleCreateProjectModal(true);
                                }}
                                className="focus:outline-none"
                              >
                                <div className="flex items-center gap-2 text-custom-text-200">
                                  <FolderPlus className="h-3.5 w-3.5" />
                                  Create new project
                                </div>
                                <kbd>P</kbd>
                              </Command.Item>
                            </Command.Group>
                          )}

                          {/* project actions */}
                          {projectId && <CommandPaletteProjectActions closePalette={closePalette} />}

                          <Command.Group heading="Workspace Settings">
                            <Command.Item
                              onSelect={() => {
                                setPlaceholder("Search workspace settings...");
                                setSearchTerm("");
                                setPages([...pages, "settings"]);
                              }}
                              className="focus:outline-none"
                            >
                              <div className="flex items-center gap-2 text-custom-text-200">
                                <Settings className="h-3.5 w-3.5" />
                                Search settings...
                              </div>
                            </Command.Item>
                          </Command.Group>
                          <Command.Group heading="Account">
                            <Command.Item onSelect={createNewWorkspace} className="focus:outline-none">
                              <div className="flex items-center gap-2 text-custom-text-200">
                                <FolderPlus className="h-3.5 w-3.5" />
                                Create new workspace
                              </div>
                            </Command.Item>
                            <Command.Item
                              onSelect={() => {
                                setPlaceholder("Change interface theme...");
                                setSearchTerm("");
                                setPages([...pages, "change-interface-theme"]);
                              }}
                              className="focus:outline-none"
                            >
                              <div className="flex items-center gap-2 text-custom-text-200">
                                <Settings className="h-3.5 w-3.5" />
                                Change interface theme...
                              </div>
                            </Command.Item>
                          </Command.Group>

                          {/* help options */}
                          <CommandPaletteHelpActions closePalette={closePalette} />
                        </>
                      )}

                      {/* workspace settings actions */}
                      {page === "settings" && workspaceSlug && (
                        <CommandPaletteWorkspaceSettingsActions closePalette={closePalette} />
                      )}

                      {/* issue details page actions */}
                      {page === "change-issue-state" && issueDetails && (
                        <ChangeIssueState closePalette={closePalette} issue={issueDetails} />
                      )}
                      {page === "change-issue-priority" && issueDetails && (
                        <ChangeIssuePriority closePalette={closePalette} issue={issueDetails} />
                      )}
                      {page === "change-issue-assignee" && issueDetails && (
                        <ChangeIssueAssignee closePalette={closePalette} issue={issueDetails} />
                      )}

                      {/* theme actions */}
                      {page === "change-interface-theme" && (
                        <CommandPaletteThemeActions
                          closePalette={() => {
                            closePalette();
                            setPages((pages) => pages.slice(0, -1));
                          }}
                        />
                      )}
                    </Command.List>
                  </Command>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
