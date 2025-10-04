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
import type { CommandConfig, CommandContext, CommandExecutionContext, TPowerKPageKeys } from "../types";
import { CycleSelectionPage } from "./cycle-selection-page";
import { IssueSelectionPage } from "./issue-selection-page";
import { PowerKModalDefaultPage } from "./default";
import { ProjectSelectionPage } from "./project-selection-page";

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
  projectSelectionAction: "navigate" | "cycle" | null;
  selectedProjectId: string | null;
  resolvedPath: string;
  setPages: (pages: TPowerKPageKeys[] | ((prev: TPowerKPageKeys[]) => TPowerKPageKeys[])) => void;
  setPlaceholder: (placeholder: string) => void;
  setSelectedProjectId: (id: string | null) => void;
  fetchAllCycles: (workspaceSlug: string, projectId: string) => void;
  onCommandSelect: (command: CommandConfig) => void;
  isWorkspaceLevel?: boolean;
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
    projectSelectionAction,
    selectedProjectId,
    resolvedPath,
    setPages,
    setPlaceholder,
    setSelectedProjectId,
    fetchAllCycles,
    onCommandSelect,
    isWorkspaceLevel = false,
  } = props;
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

  // Project selection page
  if (activePage === "open-project" && workspaceSlug) {
    return (
      <ProjectSelectionPage
        workspaceSlug={workspaceSlug}
        projectSelectionAction={projectSelectionAction}
        setSelectedProjectId={setSelectedProjectId}
        fetchAllCycles={fetchAllCycles}
        setPages={setPages}
        setPlaceholder={setPlaceholder}
      />
    );
  }

  // Cycle selection page
  if (activePage === "open-cycle" && workspaceSlug && selectedProjectId) {
    return <CycleSelectionPage workspaceSlug={workspaceSlug} selectedProjectId={selectedProjectId} />;
  }

  // Issue selection page
  if (activePage === "open-issue" && workspaceSlug) {
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
