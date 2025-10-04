"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
// plane imports
import {
  PROJECT_TRACKER_ELEMENTS,
  WORK_ITEM_TRACKER_ELEMENTS,
  WORKSPACE_DEFAULT_SEARCH_RESULT,
} from "@plane/constants";
import { IWorkspaceSearchResults } from "@plane/types";
import { getTabIndex } from "@plane/utils";
// components
import { CommandConfig, TPowerKPageKeys } from "@/components/command-palette";
// helpers
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import useDebounce from "@/hooks/use-debounce";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web imports
import { WorkspaceService } from "@/plane-web/services";
// local imports
import { PowerKContextBasedActions } from "../pages/context-based-actions";
import { PowerKModalFooter } from "./footer";
import { PowerKModalHeader } from "./header";
import { useCommandRegistryInitializer, useKeySequenceHandler } from "../hooks";
import { PowerKModalPagesList } from "../pages";
import { PowerKModalSearchResults } from "./search-results";

const workspaceService = new WorkspaceService();

export const PowerKModal: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId: routerProjectId, workItem: workItemIdentifier } = useParams();
  // states
  const [placeholder, setPlaceholder] = useState("Type a command or search");
  const [resultsCount, setResultsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<IWorkspaceSearchResults>(WORKSPACE_DEFAULT_SEARCH_RESULT);
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);
  const [pages, setPages] = useState<TPowerKPageKeys[]>([]);
  const [searchInIssue, setSearchInIssue] = useState(false);
  const [projectSelectionAction, setProjectSelectionAction] = useState<"navigate" | "cycle" | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  // store hooks
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();
  const { fetchAllCycles } = useCycle();
  const { getPartialProjectById } = useProject();
  const { platform, isMobile } = usePlatformOS();
  const { isCommandPaletteOpen, toggleCommandPaletteModal, activeEntity, clearActiveEntity } = useCommandPalette();
  // derived values
  const workItemId = workItemIdentifier ? getIssueIdByIdentifier(workItemIdentifier.toString()) : null;
  const workItemDetails = workItemId ? getIssueById(workItemId) : null;
  const projectId = workItemDetails?.project_id ?? routerProjectId;
  const activePage = pages.length > 0 ? pages[pages.length - 1] : undefined;
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { baseTabIndex } = getTabIndex(undefined, isMobile);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/search/search" });

  const openProjectSelection = useCallback(
    (action: "navigate" | "cycle") => {
      if (!workspaceSlug) return;
      setPlaceholder("Search projects");
      setSearchTerm("");
      setProjectSelectionAction(action);
      setSelectedProjectId(null);
      setPages((p) => [...p, "open-project"]);
    },
    [workspaceSlug]
  );

  const openProjectList = useCallback(() => openProjectSelection("navigate"), [openProjectSelection]);

  const openCycleList = useCallback(() => {
    if (!workspaceSlug) return;
    const currentProject = projectId ? getPartialProjectById(projectId.toString()) : null;
    if (currentProject && currentProject.cycle_view) {
      setSelectedProjectId(projectId.toString());
      setPlaceholder("Search cycles");
      setSearchTerm("");
      setPages((p) => [...p, "open-cycle"]);
      fetchAllCycles(workspaceSlug.toString(), projectId.toString());
    } else {
      openProjectSelection("cycle");
    }
  }, [openProjectSelection, workspaceSlug, projectId, getPartialProjectById, fetchAllCycles]);

  const openIssueList = useCallback(() => {
    if (!workspaceSlug) return;
    setPlaceholder("Search issues");
    setSearchTerm("");
    setPages((p) => [...p, "open-issue"]);
  }, [workspaceSlug]);

  const closePalette = useCallback(() => {
    toggleCommandPaletteModal(false);
    setTimeout(() => {
      setPages([]);
      setPlaceholder("Type a command or search");
      setProjectSelectionAction(null);
      setSelectedProjectId(null);
    }, 500);
  }, [toggleCommandPaletteModal]);

  // Initialize command registry
  const { context, registry, executionContext, initializeCommands } = useCommandRegistryInitializer({
    setPages,
    setPlaceholder,
    setSearchTerm,
    closePalette,
    openProjectList,
    openCycleList,
    openIssueList,
    isWorkspaceLevel,
  });

  const handleKeySequence = useKeySequenceHandler(registry, executionContext);

  useEffect(() => {
    if (!isCommandPaletteOpen || !activeEntity) return;

    if (activeEntity === "project") openProjectList();
    if (activeEntity === "cycle") openCycleList();
    if (activeEntity === "issue") openIssueList();
    clearActiveEntity();
  }, [isCommandPaletteOpen, activeEntity, clearActiveEntity, openProjectList, openCycleList, openIssueList]);

  useEffect(() => {
    if (workItemDetails && isCommandPaletteOpen) {
      setSearchInIssue(true);
    }
  }, [workItemDetails, isCommandPaletteOpen]);

  useEffect(() => {
    if (!projectId && !isWorkspaceLevel) {
      setIsWorkspaceLevel(true);
    } else {
      setIsWorkspaceLevel(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!workspaceSlug) return;

    setIsLoading(true);

    if (debouncedSearchTerm && activePage !== "open-issue") {
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
            (accumulator, key) => (results.results as any)[key]?.length + accumulator,
            0
          );
          setResultsCount(count);
        })
        .finally(() => {
          setIsLoading(false);
          setIsSearching(false);
        });
    } else {
      setResults(WORKSPACE_DEFAULT_SEARCH_RESULT);
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, isWorkspaceLevel, projectId, workspaceSlug, activePage]);

  // Track initialization to prevent multiple calls
  const isInitializedRef = useRef(false);

  // Initialize commands immediately when modal is first opened
  if (isCommandPaletteOpen && !isInitializedRef.current) {
    initializeCommands();
    isInitializedRef.current = true;
  } else if (!isCommandPaletteOpen && isInitializedRef.current) {
    // Reset initialization flag when modal closes
    isInitializedRef.current = false;
  }

  const handleCommandSelect = useCallback(
    async (command: CommandConfig) => {
      if (command.id === "create-work-item") {
        captureClick({
          elementName: WORK_ITEM_TRACKER_ELEMENTS.COMMAND_PALETTE_ADD_BUTTON,
        });
      } else if (command.id === "create-project") {
        captureClick({
          elementName: PROJECT_TRACKER_ELEMENTS.COMMAND_PALETTE_CREATE_BUTTON,
        });
      }

      // Execute command using registry
      await registry.executeCommand(command.id, executionContext);
    },
    [registry, executionContext]
  );

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && !activePage && searchTerm === "") {
        handleKeySequence(e);
      }
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        e.stopPropagation();
        closePalette();
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const commandList = document.querySelector("[cmdk-list]");
        const items = commandList?.querySelectorAll("[cmdk-item]") || [];
        const selectedItem = commandList?.querySelector('[aria-selected="true"]');
        if (items.length === 0) return;

        const currentIndex = Array.from(items).indexOf(selectedItem as Element);
        let nextIndex;

        if (e.shiftKey) {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        } else {
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }

        const nextItem = items[nextIndex] as HTMLElement;
        if (nextItem) {
          nextItem.setAttribute("aria-selected", "true");
          selectedItem?.setAttribute("aria-selected", "false");
          nextItem.focus();
          nextItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }

      if (e.key === "Escape") {
        e.preventDefault();
        if (searchTerm) setSearchTerm("");
        else closePalette();
        return;
      }

      if (e.key === "Backspace" && !searchTerm && activePage) {
        e.preventDefault();
        const newPages = pages.slice(0, -1);
        const newPage = newPages[newPages.length - 1];
        setPages(newPages);
        if (!newPage) setPlaceholder("Type a command or search");
        else if (newPage === "open-project") setPlaceholder("Search projects");
        else if (newPage === "open-cycle") setPlaceholder("Search cycles");
        if (activePage === "open-cycle") setSelectedProjectId(null);
        if (activePage === "open-project" && !newPage) setProjectSelectionAction(null);
      }
    },
    [
      handleKeySequence,
      activePage,
      searchTerm,
      pages,
      setPages,
      setPlaceholder,
      setProjectSelectionAction,
      setSelectedProjectId,
      closePalette,
    ]
  );

  return (
    <Transition.Root show={isCommandPaletteOpen} afterLeave={() => setSearchTerm("")} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-30"
        onClose={() => {
          closePalette();
          if (searchInIssue) {
            setSearchInIssue(true);
          }
        }}
      >
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
              <Dialog.Panel className="relative flex w-full max-w-2xl transform flex-col items-center justify-center divide-y divide-custom-border-200 divide-opacity-10 rounded-lg bg-custom-background-100 shadow-custom-shadow-md transition-all">
                <div className="w-full max-w-2xl">
                  <Command
                    filter={(value, search) => {
                      if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                      return 0;
                    }}
                    shouldFilter={searchTerm.length > 0}
                    onKeyDown={handleKeydown}
                  >
                    <PowerKModalHeader
                      placeholder={placeholder}
                      searchTerm={searchTerm}
                      onSearchTermChange={setSearchTerm}
                      baseTabIndex={baseTabIndex}
                      searchInIssue={searchInIssue}
                      issueDetails={workItemDetails}
                      onClearSearchInIssue={() => setSearchInIssue(false)}
                    />
                    <Command.List className="vertical-scrollbar scrollbar-sm max-h-96 overflow-scroll p-2">
                      <PowerKModalSearchResults
                        searchTerm={searchTerm}
                        debouncedSearchTerm={debouncedSearchTerm}
                        resultsCount={resultsCount}
                        isLoading={isLoading}
                        isSearching={isSearching}
                        isWorkspaceLevel={!projectId || isWorkspaceLevel}
                        activePage={activePage}
                        results={results}
                        resolvedPath={resolvedPath}
                      />
                      <PowerKContextBasedActions
                        activePage={activePage}
                        handleClose={closePalette}
                        handleUpdateSearchTerm={setSearchTerm}
                        handleUpdatePage={(page) => setPages((pages) => [...pages, page])}
                      />
                      <PowerKModalPagesList
                        activePage={activePage}
                        context={context}
                        executionContext={executionContext}
                        workspaceSlug={workspaceSlug?.toString()}
                        projectId={projectId?.toString()}
                        searchTerm={searchTerm}
                        debouncedSearchTerm={debouncedSearchTerm}
                        isLoading={isLoading}
                        isSearching={isSearching}
                        projectSelectionAction={projectSelectionAction}
                        selectedProjectId={selectedProjectId}
                        resolvedPath={resolvedPath}
                        setPages={setPages}
                        setPlaceholder={setPlaceholder}
                        setSelectedProjectId={setSelectedProjectId}
                        fetchAllCycles={fetchAllCycles}
                        onCommandSelect={handleCommandSelect}
                        isWorkspaceLevel={isWorkspaceLevel}
                      />
                    </Command.List>
                    <PowerKModalFooter
                      platform={platform}
                      isWorkspaceLevel={isWorkspaceLevel}
                      projectId={projectId?.toString()}
                      onWorkspaceLevelChange={setIsWorkspaceLevel}
                    />
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
