"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Dialog, Transition } from "@headlessui/react";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// local imports
import type { TPowerKCommandConfig, TPowerKContext } from "../../core/types";
import { PowerKModalPagesList } from "../pages";
import { PowerKContextBasedActions } from "../pages/context-based-actions";
import { PowerKModalFooter } from "./footer";
import { PowerKModalHeader } from "./header";
import { PowerKModalSearchResults } from "./search-results";

type Props = {
  context: TPowerKContext;
  isOpen: boolean;
  onClose: () => void;
};

export const CommandPaletteModal = observer(({ context, isOpen, onClose }: Props) => {
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);
  // store hooks
  const { activePageV2, setActivePageV2, setActiveContextV2 } = useCommandPalette();

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
        setActivePageV2(command.page);
        setSearchTerm("");
      }
    },
    [context, setActivePageV2]
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
        if (activePageV2) {
          // Go back from selection page
          setActivePageV2(null);
          context.setActiveCommand(null);
        }
        return;
      }
    },
    [searchTerm, activePageV2, onClose, setActivePageV2, context]
  );

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSearchTerm("");
        setActivePageV2(null);
        context.setActiveCommand(null);
      }, 500);
    }
  }, [isOpen, setActivePageV2, context]);

  const debouncedSearchTerm = "";
  const resultsCount = 0;
  const isLoading = false;
  const isSearching = false;
  const results = {
    results: {
      workspace: [],
      project: [],
      issue: [],
      cycle: [],
      module: [],
      issue_view: [],
      page: [],
    },
  };
  const resolvedPath = "";

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
                  <Command
                    filter={(i18nValue: string, search: string) => {
                      if (i18nValue.toLowerCase().includes(search.toLowerCase())) return 1;
                      return 0;
                    }}
                    shouldFilter={searchTerm.length > 0}
                    onKeyDown={handleKeyDown}
                    className="w-full"
                  >
                    <PowerKModalHeader
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      activeContext={context.activeContext}
                      handleClearContext={() => setActiveContextV2(null)}
                      activePage={activePageV2}
                    />
                    <Command.List className="vertical-scrollbar scrollbar-sm max-h-96 overflow-scroll p-2">
                      <PowerKModalSearchResults
                        searchTerm={searchTerm}
                        debouncedSearchTerm={debouncedSearchTerm}
                        resultsCount={resultsCount}
                        isLoading={isLoading}
                        isSearching={isSearching}
                        isWorkspaceLevel={!context.params.projectId || isWorkspaceLevel}
                        activePage={activePageV2}
                        results={results}
                        resolvedPath={resolvedPath}
                      />
                      <PowerKContextBasedActions
                        activeContext={context.activeContext}
                        activePage={activePageV2}
                        handleClose={context.closePalette}
                        handleSelection={handlePageDataSelection}
                        handleUpdateSearchTerm={setSearchTerm}
                        handleUpdatePage={context.setActivePage}
                      />
                      <PowerKModalPagesList
                        activePage={activePageV2}
                        context={context}
                        onPageDataSelect={handlePageDataSelection}
                        onCommandSelect={handleCommandSelect}
                      />
                    </Command.List>
                    {/* Footer hints */}
                    <PowerKModalFooter
                      isWorkspaceLevel={isWorkspaceLevel}
                      projectId={context.params.projectId?.toString()}
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
