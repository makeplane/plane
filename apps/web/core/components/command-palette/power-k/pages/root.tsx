"use client";

import React from "react";
import { observer } from "mobx-react";
// plane types
import type { IWorkspaceSearchResults } from "@plane/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { CommandPaletteThemeActions, CommandPaletteWorkspaceSettingsActions } from "../actions";
import { SelectProjectStep, SelectCycleStep, SelectModuleStep } from "../steps";
import type { CommandConfig, CommandContext, CommandExecutionContext, TPowerKPageKeys } from "../types";
import { PowerKModalDefaultPage } from "./default";
import { IssueSelectionPage } from "./issue-selection-page";

type Props = {
  activePage: TPowerKPageKeys | undefined;
  context: CommandContext;
  executionContext: CommandExecutionContext;
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  searchTerm: string;
  debouncedSearchTerm: string;
  isLoading: boolean;
  isSearching: boolean;
  results: IWorkspaceSearchResults;
  resolvedPath: string;
  setPages: (pages: TPowerKPageKeys[] | ((prev: TPowerKPageKeys[]) => TPowerKPageKeys[])) => void;
  onCommandSelect: (command: CommandConfig) => void;
  isWorkspaceLevel?: boolean;
  // New props for step execution
  activeCommand: CommandConfig | null;
  currentStepIndex: number;
  commandStepData: Record<string, any>;
  onStepComplete: (selectedData?: { key: string; value: any }) => Promise<void>;
};

export const PowerKModalPagesList: React.FC<Props> = observer((props) => {
  const {
    activePage,
    context,
    executionContext,
    workspaceSlug,
    projectId,
    searchTerm,
    debouncedSearchTerm,
    isLoading,
    isSearching,
    resolvedPath,
    setPages,
    onCommandSelect,
    isWorkspaceLevel = false,
    activeCommand,
    currentStepIndex,
    commandStepData,
    onStepComplete,
  } = props;

  // Get the current step's dataKey if we're in a multi-step flow
  const currentStepDataKey = activeCommand?.steps?.[currentStepIndex]?.dataKey;
  // store hooks
  const { toggleCommandPaletteModal } = useCommandPalette();
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  // Main page content (no specific page)
  if (!activePage) {
    return (
      <PowerKModalDefaultPage
        context={context}
        executionContext={executionContext}
        projectId={projectId}
        onCommandSelect={onCommandSelect}
      />
    );
  }

  // Project selection step
  if (activePage === "select-project" && workspaceSlug) {
    return (
      <SelectProjectStep
        workspaceSlug={workspaceSlug}
        onSelect={async (project) => {
          if (currentStepDataKey) {
            await onStepComplete({ key: currentStepDataKey, value: project.id });
          }
        }}
      />
    );
  }

  // Cycle selection step
  if (activePage === "select-cycle" && workspaceSlug) {
    const selectedProjectId = commandStepData?.projectId || projectId;
    if (!selectedProjectId) return null;

    return (
      <SelectCycleStep
        workspaceSlug={workspaceSlug}
        projectId={selectedProjectId}
        onSelect={async (cycle) => {
          if (currentStepDataKey) {
            await onStepComplete({ key: currentStepDataKey, value: cycle.id });
          }
        }}
      />
    );
  }

  // Module selection step
  if (activePage === "select-module" && workspaceSlug) {
    const selectedProjectId = commandStepData?.projectId || projectId;
    if (!selectedProjectId) return null;

    return (
      <SelectModuleStep
        workspaceSlug={workspaceSlug}
        projectId={selectedProjectId}
        onSelect={async (module) => {
          if (currentStepDataKey) {
            await onStepComplete({ key: currentStepDataKey, value: module.id });
          }
        }}
      />
    );
  }

  // Issue selection step
  if (activePage === "select-issue" && workspaceSlug) {
    return (
      <IssueSelectionPage
        workspaceSlug={workspaceSlug}
        projectId={projectId}
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
  if (activePage === "settings" && workspaceSlug) {
    return <CommandPaletteWorkspaceSettingsActions closePalette={() => toggleCommandPaletteModal(false)} />;
  }

  // Theme actions page
  if (activePage === "change-theme") {
    return (
      <CommandPaletteThemeActions
        closePalette={() => {
          toggleCommandPaletteModal(false);
          setPages((pages) => pages.slice(0, -1));
        }}
      />
    );
  }

  return null;
});
