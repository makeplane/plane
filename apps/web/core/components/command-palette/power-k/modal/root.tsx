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
// helpers
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import useDebounce from "@/hooks/use-debounce";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web imports
import { WorkspaceService } from "@/plane-web/services";
// local imports
import { commandExecutor } from "../../command-executor";
import { PAGE_PLACEHOLDERS } from "../../constants";
import type { CommandConfig, TPowerKPageKeys } from "../../power-k/types";
import { useCommandRegistryInitializer, useKeySequenceHandler } from "../hooks";
import { PowerKModalPagesList } from "../pages";
import { PowerKContextBasedActions } from "../pages/context-based-actions";
import { PowerKModalFooter } from "./footer";
import { PowerKModalHeader } from "./header";
import { PowerKModalSearchResults } from "./search-results";

const workspaceService = new WorkspaceService();

export const PowerKModal: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId: routerProjectId, workItem: workItemIdentifier } = useParams();
  // states
  const [resultsCount, setResultsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<IWorkspaceSearchResults>(WORKSPACE_DEFAULT_SEARCH_RESULT);
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);
  const [pages, setPages] = useState<TPowerKPageKeys[]>([]);
  const [searchInIssue, setSearchInIssue] = useState(false);

  // Command execution state
  const [activeCommand, setActiveCommand] = useState<CommandConfig | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [commandStepData, setCommandStepData] = useState<Record<string, any>>({});
  const [executedSteps, setExecutedSteps] = useState<number[]>([]); // Track which steps were actually executed (not skipped)

  // store hooks
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();
  const { platform, isMobile } = usePlatformOS();
  const { isCommandPaletteOpen, toggleCommandPaletteModal, activeEntity, clearActiveEntity } = useCommandPalette();
  // derived values
  const workItemId = workItemIdentifier ? getIssueIdByIdentifier(workItemIdentifier.toString()) : null;
  const workItemDetails = workItemId ? getIssueById(workItemId) : null;
  const projectId = workItemDetails?.project_id ?? routerProjectId;
  const activePage = pages.length > 0 ? pages[pages.length - 1] : undefined;
  const placeholder = activePage ? PAGE_PLACEHOLDERS[activePage] : PAGE_PLACEHOLDERS.default;
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { baseTabIndex } = getTabIndex(undefined, isMobile);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/search/search" });

  // Reset command execution state
  const resetCommandExecution = useCallback(() => {
    setActiveCommand(null);
    setCurrentStepIndex(0);
    setCommandStepData({});
    setExecutedSteps([]);
    setPages([]);
  }, []);

  const closePalette = useCallback(() => {
    toggleCommandPaletteModal(false);
    setTimeout(() => {
      resetCommandExecution();
    }, 500);
  }, [resetCommandExecution, toggleCommandPaletteModal]);

  // Initialize command registry (we'll update context with stepData dynamically)
  const { context, registry, executionContext, initializeCommands } = useCommandRegistryInitializer({
    setPages,
    setSearchTerm,
    closePalette,
    isWorkspaceLevel,
  });

  const handleKeySequence = useKeySequenceHandler(registry, executionContext);

  // Execute the current step of the active command
  const executeCurrentStep = useCallback(async () => {
    if (!activeCommand || !activeCommand.steps) return;

    const step = activeCommand.steps[currentStepIndex];
    if (!step) {
      // No more steps, reset and close
      resetCommandExecution();
      return;
    }

    // Update context with stepData
    const updatedContext = {
      ...executionContext,
      context: {
        ...context,
        stepData: commandStepData,
      },
    };

    // Execute the step
    const result = await commandExecutor.executeSingleStep(step, updatedContext);

    // Handle result
    if (result.skipped) {
      // Step was skipped due to condition, don't track it
      // Move to next step without adding to executed steps
      setCurrentStepIndex((i) => i + 1);
      return;
    }

    if (result.closePalette) {
      // Step closes palette (navigate/modal)
      closePalette();
      resetCommandExecution();
      return;
    }

    if (result.waitingForSelection) {
      // Step is waiting for user selection, track it as executed
      setExecutedSteps((prev) => {
        // Only add if not already in the list (for backspace re-execution)
        if (prev.includes(currentStepIndex)) return prev;
        return [...prev, currentStepIndex];
      });
      // The selection handler will call handleStepComplete when done
      return;
    }

    if (result.continue) {
      // Step completed (action step), track and move to next
      setExecutedSteps((prev) => {
        if (prev.includes(currentStepIndex)) return prev;
        return [...prev, currentStepIndex];
      });
      setCurrentStepIndex((i) => i + 1);
    } else {
      // Step says don't continue, reset
      resetCommandExecution();
    }
  }, [
    activeCommand,
    currentStepIndex,
    commandStepData,
    context,
    executionContext,
    closePalette,
    resetCommandExecution,
  ]);

  // Handle step completion (called by selection components)
  const handleStepComplete = useCallback(async (selectedData?: { key: string; value: any }) => {
    // Update step data if selection was made
    if (selectedData) {
      setCommandStepData((prev) => ({
        ...prev,
        [selectedData.key]: selectedData.value,
      }));
    }

    // Don't remove the page - keep page stack for backspace navigation
    // Pages will be cleared when palette closes or final step executes

    // Move to next step (this will trigger executeCurrentStep via useEffect)
    setCurrentStepIndex((i) => i + 1);
  }, []);

  // Start executing a command
  const startCommandExecution = useCallback(
    async (command: CommandConfig) => {
      // If it's a simple action command, just execute it
      if (command.action) {
        await commandExecutor.executeCommand(command, executionContext);
        return;
      }

      // If it has steps, set up for multi-step execution
      if (command.steps && command.steps.length > 0) {
        setActiveCommand(command);
        setCurrentStepIndex(0);
        setCommandStepData({});
        setExecutedSteps([]); // Reset executed steps for new command
        // executeCurrentStep will be called by useEffect when state updates
      }
    },
    [executionContext]
  );

  // Auto-execute current step when it changes
  useEffect(() => {
    if (activeCommand && activeCommand.steps) {
      executeCurrentStep();
    }
  }, [activeCommand, currentStepIndex, executeCurrentStep]);

  useEffect(() => {
    if (!isCommandPaletteOpen || !activeEntity) return;

    const executeShortcut = async () => {
      const commandMap: Record<string, string> = {
        project: "navigate-project",
        cycle: "navigate-cycle",
        issue: "navigate-issue",
      };

      const commandId = commandMap[activeEntity];
      if (commandId) {
        const command = registry.getCommand(commandId);
        if (command) {
          await startCommandExecution(command);
        }
      }
      clearActiveEntity();
    };

    executeShortcut();
  }, [isCommandPaletteOpen, activeEntity, clearActiveEntity, registry, startCommandExecution]);

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

    if (debouncedSearchTerm && activePage !== "select-issue") {
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

      // Execute command using new execution flow
      await startCommandExecution(command);
    },
    [startCommandExecution]
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

        // Remove the last page from stack (placeholder will auto-update from derived value)
        setPages((p) => p.slice(0, -1));

        // If we're in a multi-step command, go back to the previous EXECUTED step
        if (activeCommand && executedSteps.length > 0) {
          // Remove the current step from executed steps
          const previousExecutedSteps = executedSteps.slice(0, -1);
          setExecutedSteps(previousExecutedSteps);

          // Get the previous executed step index
          const previousStepIndex = previousExecutedSteps[previousExecutedSteps.length - 1];

          if (previousStepIndex !== undefined) {
            // Go back to previous executed step
            setCurrentStepIndex(previousStepIndex);
          } else {
            // No more executed steps, reset to show main page
            resetCommandExecution();
          }
        }
      }
    },
    [handleKeySequence, activePage, searchTerm, closePalette, activeCommand, executedSteps, resetCommandExecution]
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
                        results={results}
                        resolvedPath={resolvedPath}
                        setPages={setPages}
                        onCommandSelect={handleCommandSelect}
                        isWorkspaceLevel={isWorkspaceLevel}
                        activeCommand={activeCommand}
                        currentStepIndex={currentStepIndex}
                        commandStepData={commandStepData}
                        onStepComplete={handleStepComplete}
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
