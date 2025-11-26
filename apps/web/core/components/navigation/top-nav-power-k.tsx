import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useOutsideClickDetector } from "@plane/hooks";
import { CloseIcon, SearchIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// power-k
import type { TPowerKCommandConfig, TPowerKContext } from "@/components/power-k/core/types";
import { ProjectsAppPowerKCommandsList } from "@/components/power-k/ui/modal/commands-list";
import { PowerKModalFooter } from "@/components/power-k/ui/modal/footer";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePowerK } from "@/hooks/store/use-power-k";
import { useUser } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

export const TopNavPowerK = observer(() => {
  // router
  const router = useAppRouter();
  const params = useParams();
  const { projectId: routerProjectId, workItem: workItemIdentifier } = params;

  // states
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCommand, setActiveCommand] = useState<TPowerKCommandConfig | null>(null);
  const [shouldShowContextBasedActions, setShouldShowContextBasedActions] = useState(true);
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);

  // store hooks
  const { activeContext, setActivePage, activePage, setTopNavInputRef } = usePowerK();
  const { data: currentUser } = useUser();

  // derived values
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
  } = useIssueDetail();

  const workItemId = workItemIdentifier ? getIssueIdByIdentifier(workItemIdentifier.toString()) : undefined;
  const workItemDetails = workItemId ? getIssueById(workItemId) : undefined;
  const projectId: string | string[] | undefined | null = routerProjectId ?? workItemDetails?.project_id;

  // Build command context
  const context: TPowerKContext = useMemo(
    () => ({
      currentUserId: currentUser?.id,
      activeCommand,
      activeContext,
      shouldShowContextBasedActions,
      setShouldShowContextBasedActions,
      params: {
        ...params,
        projectId,
      },
      router,
      closePalette: () => {
        setIsOpen(false);
        setSearchTerm("");
        setActivePage(null);
        setActiveCommand(null);
      },
      setActiveCommand,
      setActivePage,
    }),
    [
      currentUser?.id,
      activeCommand,
      activeContext,
      shouldShowContextBasedActions,
      params,
      projectId,
      router,
      setActivePage,
    ]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Register input ref with PowerK store for keyboard shortcut access
  useEffect(() => {
    setTopNavInputRef(inputRef);
    return () => {
      setTopNavInputRef(null);
    };
  }, [setTopNavInputRef]);

  useOutsideClickDetector(containerRef, () => {
    if (isOpen) {
      setIsOpen(false);
      setActivePage(null);
      setActiveCommand(null);
    }
  });

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleClear = () => {
    setSearchTerm("");
    inputRef.current?.focus();
  };

  // Handle command selection
  const handleCommandSelect = useCallback(
    (command: TPowerKCommandConfig) => {
      if (command.type === "action") {
        command.action(context);
        // Always close on command selection
        context.closePalette();
      } else if (command.type === "change-page") {
        context.setActiveCommand(command);
        setActivePage(command.page);
        setSearchTerm("");
      }
    },
    [context, setActivePage]
  );

  // Handle selection page item selection
  const handlePageDataSelection = useCallback(
    (data: unknown) => {
      if (context.activeCommand?.type === "change-page") {
        context.activeCommand.onSelect(data, context);
      }
      // Always close on page data selection
      context.closePalette();
    },
    [context]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Cmd/Ctrl+K closes the search dropdown
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm("");
        setActivePage(null);
        context.setActiveCommand(null);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        if (searchTerm) {
          setSearchTerm("");
        }
        setIsOpen(false);
        inputRef.current?.blur();

        return;
      }

      if (e.key === "Backspace" && !searchTerm) {
        if (activePage) {
          e.preventDefault();
          setActivePage(null);
          context.setActiveCommand(null);
        } else if (shouldShowContextBasedActions) {
          // Optional: logic to hide context actions if desired, similar to wrapper
          context.setShouldShowContextBasedActions(false);
        }
        return;
      }

      // Arrow down/up keys to navigate command items
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && isOpen) {
        e.preventDefault();
        // Get the Command.List element
        const commandList = containerRef.current?.querySelector("[cmdk-list]") as HTMLElement;
        if (commandList) {
          // Create and dispatch a keyboard event on the list to trigger cmdk navigation
          const syntheticEvent = new KeyboardEvent("keydown", {
            key: e.key,
            bubbles: true,
            cancelable: true,
          });
          commandList.dispatchEvent(syntheticEvent);

          // Also try to focus the first/selected item
          if (e.key === "ArrowDown") {
            const firstItem = commandList.querySelector('[cmdk-item]:not([aria-disabled="true"])') as HTMLElement;
            if (firstItem) {
              firstItem.focus();
            }
          }
        }
        return;
      }

      // Enter key to execute selected command
      if (e.key === "Enter" && isOpen) {
        e.preventDefault();
        // Find the currently selected/focused item
        const selectedItem = containerRef.current?.querySelector('[cmdk-item][aria-selected="true"]') as HTMLElement;
        if (selectedItem) {
          // Trigger click on the selected item
          selectedItem.click();
        }
        return;
      }
    },
    [searchTerm, activePage, context, shouldShowContextBasedActions, setActivePage, isOpen]
  );

  return (
    <div ref={containerRef} className="relative flex justify-center">
      <div
        className={cn(
          "relative flex items-center transition-all duration-300 ease-in-out z-30",
          isOpen ? "w-[554px]" : "w-[364px]"
        )}
      >
        <div
          className={cn(
            "flex items-center w-full h-7 px-2 py-2 rounded-md bg-custom-sidebar-background-80 hover:bg-custom-background-80 transition-colors duration-200",
            isOpen && "border border-custom-border-200"
          )}
          onClick={() => inputRef.current?.focus()}
        >
          <SearchIcon className="shrink-0 size-3.5 text-custom-text-350 mr-2" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-sm text-custom-text-100 placeholder-custom-text-350 outline-none min-w-0"
          />
          {searchTerm && (
            <button type="button" onClick={handleClear} className="shrink-0 ml-2">
              <CloseIcon className="size-3.5 text-custom-text-400 hover:text-custom-text-100" />
            </button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "absolute -top-[6px] left-1/2 -translate-x-1/2  bg-custom-background-100 border border-custom-border-200 rounded-md shadow-lg overflow-hidden z-20  transition-all duration-300 ease-in-out flex flex-col px-0 pt-10",
          {
            "opacity-100 w-[574px] max-h-[80vh]": isOpen,
            "opacity-0 w-0 h-0": !isOpen,
          }
        )}
      >
        {isOpen && (
          <Command
            filter={(i18nValue: string, search: string) => {
              if (i18nValue === "no-results") return 1;
              if (i18nValue.toLowerCase().includes(search.toLowerCase())) return 1;
              return 0;
            }}
            shouldFilter={searchTerm.length > 0}
            className="w-full flex flex-col h-full"
          >
            <Command.Input value={searchTerm} hidden />
            {/* We can skip the header input since we have the main input above,
                     but we might need the context indicator if we want that feature.
                     For now, let's just render the list. */}

            <Command.List className="vertical-scrollbar scrollbar-sm max-h-[60vh] overflow-y-auto outline-none px-2 pb-4">
              <ProjectsAppPowerKCommandsList
                activePage={activePage}
                context={context}
                handleCommandSelect={handleCommandSelect}
                handlePageDataSelection={handlePageDataSelection}
                isWorkspaceLevel={isWorkspaceLevel}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            </Command.List>
            <PowerKModalFooter
              isWorkspaceLevel={isWorkspaceLevel}
              projectId={context.params.projectId?.toString()}
              onWorkspaceLevelChange={setIsWorkspaceLevel}
            />
          </Command>
        )}
      </div>
    </div>
  );
});
