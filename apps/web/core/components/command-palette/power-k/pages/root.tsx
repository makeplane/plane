"use client";

import React from "react";
import { observer } from "mobx-react";
// plane types
import type { IWorkspaceSearchResults } from "@plane/types";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import type { CommandConfig, CommandContext } from "../types";
import {
  ChangeIssueAssignee,
  ChangeIssuePriority,
  ChangeIssueState,
  CommandPaletteThemeActions,
  CommandPaletteWorkspaceSettingsActions,
} from "../actions";
import { CycleSelectionPage } from "./cycle-selection-page";
import { IssueSelectionPage } from "./issue-selection-page";
import { MainPage } from "./main-page";
import { ProjectSelectionPage } from "./project-selection-page";

type Props = {
  context: CommandContext;
  page: string | undefined;
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  issueId: string | undefined;
  issueDetails: { id: string; project_id: string | null; name?: string } | null;
  searchTerm: string;
  debouncedSearchTerm: string;
  isLoading: boolean;
  isSearching: boolean;
  searchInIssue: boolean;
  projectSelectionAction: "navigate" | "cycle" | null;
  selectedProjectId: string | null;
  results: IWorkspaceSearchResults;
  resolvedPath: string;
  pages: string[];
  setPages: (pages: string[] | ((prev: string[]) => string[])) => void;
  setPlaceholder: (placeholder: string) => void;
  setSearchTerm: (term: string) => void;
  setSelectedProjectId: (id: string | null) => void;
  fetchAllCycles: (workspaceSlug: string, projectId: string) => void;
  onCommandSelect: (command: CommandConfig) => void;
  isWorkspaceLevel?: boolean;
};

export const PowerKModalPagesList: React.FC<Props> = observer((props) => {
  const {
    context,
    page,
    workspaceSlug,
    projectId,
    issueId,
    issueDetails,
    searchTerm,
    debouncedSearchTerm,
    isLoading,
    isSearching,
    searchInIssue,
    projectSelectionAction,
    selectedProjectId,
    results,
    resolvedPath,
    pages,
    setPages,
    setPlaceholder,
    setSearchTerm,
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
  if (!page) {
    return (
      <MainPage
        context={context}
        projectId={projectId}
        issueId={issueId}
        issueDetails={issueDetails}
        debouncedSearchTerm={debouncedSearchTerm}
        results={results}
        searchInIssue={searchInIssue}
        pages={pages}
        setPages={setPages}
        setPlaceholder={setPlaceholder}
        setSearchTerm={setSearchTerm}
        onCommandSelect={onCommandSelect}
      />
    );
  }

  // Project selection page
  if (page === "open-project" && workspaceSlug) {
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
  if (page === "open-cycle" && workspaceSlug && selectedProjectId) {
    return <CycleSelectionPage workspaceSlug={workspaceSlug} selectedProjectId={selectedProjectId} />;
  }

  // Issue selection page
  if (page === "open-issue" && workspaceSlug) {
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
  if (page === "settings" && workspaceSlug) {
    return <CommandPaletteWorkspaceSettingsActions closePalette={() => toggleCommandPaletteModal(false)} />;
  }

  // Issue details pages
  if (page === "change-issue-state" && issueDetails && issueId && getIssueById) {
    const fullIssue = getIssueById(issueId);
    if (fullIssue) {
      return <ChangeIssueState closePalette={() => toggleCommandPaletteModal(false)} issue={fullIssue} />;
    }
  }

  if (page === "change-issue-priority" && issueDetails && issueId && getIssueById) {
    const fullIssue = getIssueById(issueId);
    if (fullIssue) {
      return <ChangeIssuePriority closePalette={() => toggleCommandPaletteModal(false)} issue={fullIssue} />;
    }
  }

  if (page === "change-issue-assignee" && issueDetails && issueId && getIssueById) {
    const fullIssue = getIssueById(issueId);
    if (fullIssue) {
      return <ChangeIssueAssignee closePalette={() => toggleCommandPaletteModal(false)} issue={fullIssue} />;
    }
  }

  // Theme actions page
  if (page === "change-interface-theme") {
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
