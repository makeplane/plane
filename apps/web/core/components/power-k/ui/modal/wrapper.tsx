/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Dialog, DialogContent } from "@makeplane/propel/components/dialog";
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
    if (isOpen) return;
    // Wait for the close animation. Reopening within the delay cancels the reset.
    const timeoutId = setTimeout(() => {
      setSearchTerm("");
      setActivePage(null);
      context.setActiveCommand(null);
      context.setShouldShowContextBasedActions(true);
    }, 200);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open, eventDetails) => {
        // Escape is owned by `Command`'s `onKeyDown` below, which clears the search term before it
        // closes; letting Base UI's Escape through as well would skip that first step. Outside press
        // still closes, as the legacy headless `Dialog onClose` did.
        if (open || eventDetails.reason === "escape-key") return;
        onClose();
      }}
    >
      {/* legacy panel was `max-w-2xl` (672px) = `md` */}
      <DialogContent size="md">
        <Command
          filter={(i18nValue: string, search: string) => {
            if (i18nValue === "no-results") return 1;
            if (i18nValue.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
          shouldFilter={searchTerm.length > 0}
          onKeyDown={handleKeyDown}
          className="flex min-h-0 w-full flex-1 flex-col"
        >
          <PowerKModalHeader
            activePage={activePage}
            context={context}
            onSearchChange={setSearchTerm}
            searchTerm={searchTerm}
          />
          <Command.List className="vertical-scrollbar scrollbar-sm max-h-96 min-h-0 flex-1 overflow-scroll outline-none">
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
      </DialogContent>
    </Dialog>
  );
});
