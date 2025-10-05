"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Dialog, Transition } from "@headlessui/react";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useAppRouter } from "@/hooks/use-app-router";
import type { TPowerKCommandConfig, TPowerKContext } from "../../core/types";
import { PowerKModalFooter } from "./footer";
import { PowerKModalHeader } from "./header";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug?: string; // Maybe we should get all these from context instead.
  projectId?: string;
  issueId?: string;
  currentUserId?: string;
  canPerformAnyCreateAction?: boolean;
  canPerformWorkspaceActions?: boolean;
  canPerformProjectActions?: boolean;
};

export const CommandPaletteModal = observer(
  ({
    isOpen,
    onClose,
    workspaceSlug,
    projectId,
    issueId,
    currentUserId,
    canPerformAnyCreateAction = false,
    canPerformWorkspaceActions = false,
    canPerformProjectActions = false,
  }: Props) => {
    // router
    const router = useAppRouter();
    // states
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCommand, setActiveCommand] = useState<TPowerKCommandConfig | null>(null);
    const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);
    // store hooks
    const commandPaletteStore = useCommandPalette();
    // derived values
    const commandPaletteContext = commandPaletteStore.contextEntityV2;

    // Build command context from props and store
    const context: TPowerKContext = useMemo(
      () => ({
        workspaceSlug,
        projectId,
        issueId,
        currentUserId,
        contextEntity: commandPaletteContext,
        canPerformAnyCreateAction,
        canPerformWorkspaceActions,
        canPerformProjectActions,
        router,
        closePalette: onClose,
        setActivePage: (page) => commandPaletteStore.setActivePageV2(page),
      }),
      [
        workspaceSlug,
        projectId,
        issueId,
        currentUserId,
        commandPaletteContext,
        commandPaletteStore,
        canPerformAnyCreateAction,
        canPerformWorkspaceActions,
        canPerformProjectActions,
        router,
        onClose,
      ]
    );

    // Get registry and commands from store
    const commandRegistry = commandPaletteStore.getCommandRegistryV2();
    const activePage = commandPaletteStore.activePageV2;

    // Get commands to display
    const commands = searchTerm
      ? commandRegistry.search(searchTerm, context)
      : commandRegistry.getVisibleCommands(context);

    // Handle command selection
    const handleCommandSelect = useCallback(
      (command: TPowerKCommandConfig) => {
        if (command.action) {
          // Direct action - execute and potentially close
          command.action(context);
        } else if (command.page) {
          // Opens a selection page
          setActiveCommand(command);
          commandPaletteStore.setActivePageV2(command.page);
          setSearchTerm("");
        }
      },
      [context, commandPaletteStore]
    );

    // Handle selection page item selection
    const handlePageSelection = useCallback(
      (selectedValue: any) => {
        if (activeCommand?.onSelect) {
          activeCommand.onSelect(selectedValue, context);
        }
        // Go back to main page
        commandPaletteStore.setActivePageV2(null);
        setActiveCommand(null);
        setSearchTerm("");
      },
      [activeCommand, context, commandPaletteStore]
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
            commandPaletteStore.setActivePageV2(null);
          } else if (context.contextEntity) {
            // Clear context
            commandPaletteStore.setContextEntityV2(null);
          }
          return;
        }
      },
      [searchTerm, activePage, context.contextEntity, onClose, commandPaletteStore]
    );

    // Reset state when modal closes
    useEffect(() => {
      if (!isOpen) {
        setSearchTerm("");
        commandPaletteStore.setActivePageV2(null);
      }
    }, [isOpen, commandPaletteStore]);

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
            <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
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
                <Dialog.Panel className="relative flex w-full max-w-2xl transform flex-col items-center justify-center divide-y divide-custom-border-200 divide-opacity-10 rounded-lg bg-custom-background-100 shadow-custom-shadow-md transition-all">
                  <div className="w-full max-w-2xl">
                    <Command shouldFilter={false} onKeyDown={handleKeyDown} className="w-full">
                      <PowerKModalHeader
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        contextEntity={context.contextEntity || null}
                        onClearContext={() => commandPaletteStore.setContextEntityV2(null)}
                        activePage={activePage}
                      />
                      <Command.List className="vertical-scrollbar scrollbar-sm max-h-96 overflow-scroll p-2">
                        {/* {!activePage ? (
                          // Main page - show command list
                          <CommandList commands={commands} context={context} onSelect={handleCommandSelect} />
                        ) : (
                          // Selection pages
                          <>
                            {activePage === "select-state" && (
                              <SelectStatePage
                                onSelect={handlePageSelection}
                                onClose={onClose}
                                workspaceSlug={context.workspaceSlug || ""}
                              />
                            )}
                            {activePage === "select-priority" && (
                              <SelectPriorityPage
                                onSelect={handlePageSelection}
                                onClose={onClose}
                                workspaceSlug={context.workspaceSlug || ""}
                              />
                            )}
                            {activePage === "select-project" && (
                              <SelectProjectPage
                                onSelect={handlePageSelection}
                                onClose={onClose}
                                workspaceSlug={context.workspaceSlug || ""}
                              />
                            )}
                            {activePage === "select-cycle" && (
                              <SelectCyclePage
                                onSelect={handlePageSelection}
                                onClose={onClose}
                                workspaceSlug={context.workspaceSlug || ""}
                                projectId={context.projectId}
                              />
                            )}
                          </>
                        )} */}
                      </Command.List>
                      {/* Footer hints */}
                      <PowerKModalFooter
                        isWorkspaceLevel={isWorkspaceLevel}
                        projectId={context.projectId}
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
  }
);
