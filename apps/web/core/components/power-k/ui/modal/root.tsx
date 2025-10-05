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
  const [activeCommand, setActiveCommand] = useState<TPowerKCommandConfig | null>(null);
  const [isWorkspaceLevel, setIsWorkspaceLevel] = useState(false);
  // store hooks
  const { activePageV2, setActivePageV2, setContextEntityV2 } = useCommandPalette();

  // Handle command selection
  const handleCommandSelect = useCallback(
    (command: TPowerKCommandConfig) => {
      if (command.type === "action") {
        // Direct action - execute and potentially close
        command.action(context);
      } else if (command.type === "change-page") {
        // Opens a selection page
        setActiveCommand(command);
        setActivePageV2(command.page);
        setSearchTerm("");
      }
    },
    [context, setActivePageV2]
  );

  // Handle selection page item selection
  const handlePageSelection = useCallback(
    (data: unknown) => {
      if (activeCommand?.type === "change-page") {
        activeCommand.onSelect(data, context);
      }
      // Go back to main page
      setActivePageV2(null);
      setActiveCommand(null);
      setSearchTerm("");
    },
    [activeCommand, context, setActivePageV2]
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
        } else if (context.contextEntity) {
          // Clear context
          setContextEntityV2(null);
        }
        return;
      }
    },
    [searchTerm, activePageV2, context.contextEntity, onClose, setActivePageV2, setContextEntityV2]
  );

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setActivePageV2(null);
    }
  }, [isOpen, setActivePageV2]);

  const debouncedSearchTerm = "";
  const resultsCount = 0;
  const isLoading = false;
  const isSearching = false;
  const results = {
    results: {},
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
                  <Command shouldFilter={false} onKeyDown={handleKeyDown} className="w-full">
                    <PowerKModalHeader
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      contextEntity={context.contextEntity || null}
                      onClearContext={() => setContextEntityV2(null)}
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
                      {/* <PowerKContextBasedActions
                        activePage={activePageV2}
                        handleClose={context.closePalette}
                        handleUpdateSearchTerm={setSearchTerm}
                        handleUpdatePage={context.setActivePage}
                      /> */}
                      <PowerKModalPagesList
                        activePage={activePageV2}
                        context={context}
                        searchTerm={searchTerm}
                        debouncedSearchTerm={debouncedSearchTerm}
                        isLoading={isLoading}
                        isSearching={isSearching}
                        resolvedPath={resolvedPath}
                        onCommandSelect={handleCommandSelect}
                        isWorkspaceLevel={isWorkspaceLevel}
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
