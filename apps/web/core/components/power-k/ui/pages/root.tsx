"use client";

import React from "react";
import { observer } from "mobx-react";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// local imports
import { TPowerKCommandConfig, TPowerKContext, TPowerKPageType } from "../../core/types";
import { CommandPaletteThemeActions, CommandPaletteWorkspaceSettingsActions } from "../actions";
// import { SelectProjectStep, SelectCycleStep, SelectModuleStep } from "../steps";
import { PowerKModalDefaultPage } from "./default";
import { IssueSelectionPage } from "./issue-selection-page";

type Props = {
  activePage: TPowerKPageType | null;
  context: TPowerKContext;
  searchTerm: string;
  debouncedSearchTerm: string;
  isLoading: boolean;
  isSearching: boolean;
  resolvedPath: string;
  onCommandSelect: (command: TPowerKCommandConfig) => void;
  isWorkspaceLevel: boolean;
};

export const PowerKModalPagesList: React.FC<Props> = observer((props) => {
  const {
    activePage,
    context,
    searchTerm,
    debouncedSearchTerm,
    isLoading,
    isSearching,
    resolvedPath,
    onCommandSelect,
    isWorkspaceLevel = false,
  } = props;
  // store hooks
  const { toggleCommandPaletteModal } = useCommandPalette();

  // Main page content (no specific page)
  if (!activePage) {
    return <PowerKModalDefaultPage context={context} onCommandSelect={onCommandSelect} />;
  }

  // // Project selection step
  // if (activePage === "select-project" && workspaceSlug) {
  //   return (
  //     <SelectProjectStep
  //       workspaceSlug={workspaceSlug}
  //       onSelect={async (project) => {
  //         if (currentStepDataKey) {
  //           await onStepComplete({ key: currentStepDataKey, value: project.id });
  //         }
  //       }}
  //     />
  //   );
  // }

  // // Cycle selection step
  // if (activePage === "select-cycle" && workspaceSlug) {
  //   return (
  //     <SelectCycleStep
  //       workspaceSlug={workspaceSlug}
  //       projectId={selectedProjectId}
  //       onSelect={async (cycle) => {
  //         if (currentStepDataKey) {
  //           await onStepComplete({ key: currentStepDataKey, value: cycle.id });
  //         }
  //       }}
  //     />
  //   );
  // }

  // // Module selection step
  // if (activePage === "select-module" && workspaceSlug) {
  //   const selectedProjectId = commandStepData?.projectId || projectId;
  //   if (!selectedProjectId) return null;

  //   return (
  //     <SelectModuleStep
  //       workspaceSlug={workspaceSlug}
  //       projectId={selectedProjectId}
  //       onSelect={async (module) => {
  //         if (currentStepDataKey) {
  //           await onStepComplete({ key: currentStepDataKey, value: module.id });
  //         }
  //       }}
  //     />
  //   );
  // }

  // Issue selection step
  if (activePage === "select-work-item" && context.params.workspaceSlug) {
    return (
      <IssueSelectionPage
        workspaceSlug={context.params.workspaceSlug?.toString()}
        projectId={context.params.projectId?.toString()}
        searchTerm={searchTerm}
        debouncedSearchTerm={debouncedSearchTerm}
        isLoading={isLoading}
        isSearching={isSearching}
        resolvedPath={resolvedPath}
        isWorkspaceLevel={isWorkspaceLevel}
      />
    );
  }

  // Workspace settings page
  if (activePage === "settings") {
    return <CommandPaletteWorkspaceSettingsActions closePalette={() => toggleCommandPaletteModal(false)} />;
  }

  // Theme actions page
  if (activePage === "change-theme") {
    return <CommandPaletteThemeActions closePalette={context.closePalette} />;
  }

  return null;
});
