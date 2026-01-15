import React, { useState, useEffect, useCallback } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Dialog, Transition } from "@headlessui/react";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
// local imports
import type { TPowerKCommandConfig, TPowerKContext } from "../../core/types";
import type { TPowerKCommandsListProps } from "./commands-list";
import { PowerKModalFooter } from "./footer";
import { PowerKModalHeader } from "./header";

type Props = {
  commandsListComponent: React.FC<TPowerKCommandsListProps>;
  context: TPowerKContext;
  hideFooter?: boolean;
  isOpen: boolean;
  onClose: () => void;
};

export const ProjectsAppPowerKModalWrapper = observer(function ProjectsAppPowerKModalWrapper(props: Props) {
  const { commandsListComponent: CommandsListComponent, context, hideFooter = false, isOpen, onClose } = props;
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);
  // store hooks
  const { activePage, setActivePage } = usePowerK();

  // Handle command selection
  const handleCommandSelect = useCallback(
    (command: TPowerKCommandConfig) => {
      if (command.type === "action") {
        // Direct action - execute and potentially close
        command.action(context);
        if (command.closeOnSelect === true) {
          context.closePalette();
        }
      } else if (command.type === "change-page") {
        // Opens a selection page
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
      // Go back to main page
      if (context.activeCommand?.closeOnSelect === true) {
        context.closePalette();
      }
    },
    [context]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Cmd/Ctrl+K closes palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose();
        return;
      }

      // Escape closes palette or clears search
      if (e.key === "Escape") {
        e.preventDefault();
        if (searchTerm) {
          setSearchTerm("");
        } else {
          onClose();
        }
        return;
      }

      // Backspace clears context or goes back from page
      if (e.key === "Backspace" && !searchTerm) {
        e.preventDefault();
        if (activePage) {
          // Go back from selection page
          setActivePage(null);
          context.setActiveCommand(null);
        } else {
          // Hide context based actions
          context.setShouldShowContextBasedActions(false);
        }
        return;
      }
    },
    [searchTerm, activePage, onClose, setActivePage, context]
  );

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSearchTerm("");
        setActivePage(null);
        context.setActiveCommand(null);
        context.setShouldShowContextBasedActions(true);
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-backdrop transition-opacity" />
        </Transition.Child>
        {/* Modal Container */}
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
              <Dialog.Panel className="relative flex w-full max-w-2xl transform flex-col items-center justify-center divide-y divide-subtle-1 divide-opacity-10 rounded-lg bg-surface-1 shadow-raised-200 transition-all">
                <Command
                  filter={(i18nValue: string, search: string) => {
                    if (i18nValue === "no-results") return 1;
                    if (i18nValue.toLowerCase().includes(search.toLowerCase())) return 1;
                    return 0;
                  }}
                  shouldFilter={searchTerm.length > 0}
                  onKeyDown={handleKeyDown}
                  className="w-full"
                >
                  <PowerKModalHeader
                    activePage={activePage}
                    context={context}
                    onSearchChange={setSearchTerm}
                    searchTerm={searchTerm}
                  />
                  <Command.List className="vertical-scrollbar scrollbar-sm max-h-96 overflow-scroll outline-none">
                    <CommandsListComponent
                      activePage={activePage}
                      context={context}
                      handleCommandSelect={handleCommandSelect}
                      handlePageDataSelection={handlePageDataSelection}
                      isWorkspaceLevel={isWorkspaceLevel}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                    />
                  </Command.List>
                  {/* Footer hints */}
                  {!hideFooter && (
                    <PowerKModalFooter
                      isWorkspaceLevel={isWorkspaceLevel}
                      projectId={context.params.projectId?.toString()}
                      onWorkspaceLevelChange={setIsWorkspaceLevel}
                    />
                  )}
                </Command>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
