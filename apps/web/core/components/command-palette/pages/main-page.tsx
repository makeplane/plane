"use client";

import React from "react";
// plane types
import { IWorkspaceSearchResults } from "@plane/types";
// components
import {
  CommandPaletteSearchResults,
  CommandPaletteIssueActions,
  CommandPaletteProjectActions,
  CommandPaletteHelpActions,
  CommandConfig,
} from "@/components/command-palette";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser } from "@/hooks/store/user";
// local imports
import { CommandRenderer } from "../command-renderer";
import { useCommandRegistry } from "../hooks";

interface IMainPageProps {
  projectId: string | undefined;
  issueId: string | undefined;
  issueDetails: { id: string; project_id: string | null; name?: string } | null;
  debouncedSearchTerm: string;
  results: IWorkspaceSearchResults;
  searchInIssue: boolean;
  pages: string[];
  setPages: (pages: string[] | ((prev: string[]) => string[])) => void;
  setPlaceholder: (placeholder: string) => void;
  setSearchTerm: (term: string) => void;
  onCommandSelect: (command: CommandConfig) => void;
}

export const MainPage: React.FC<IMainPageProps> = (props) => {
  const {
    projectId,
    issueId,
    issueDetails,
    debouncedSearchTerm,
    results,
    searchInIssue,
    pages,
    setPages,
    setPlaceholder,
    setSearchTerm,
    onCommandSelect,
  } = props;
  // store hooks
  const { toggleCommandPaletteModal } = useCommandPalette();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { canPerformAnyCreateAction } = useUser();
  const { registry } = useCommandRegistry();

  return (
    <>
      {debouncedSearchTerm !== "" && (
        <CommandPaletteSearchResults closePalette={() => toggleCommandPaletteModal(false)} results={results} />
      )}

      {/* issue actions */}
      {issueId && issueDetails && searchInIssue && getIssueById && (
        <CommandPaletteIssueActions
          closePalette={() => toggleCommandPaletteModal(false)}
          issueDetails={getIssueById(issueId)}
          pages={pages}
          setPages={setPages}
          setPlaceholder={setPlaceholder}
          setSearchTerm={setSearchTerm}
        />
      )}

      {/* New command renderer */}
      <CommandRenderer commands={registry.getVisibleCommands()} onCommandSelect={onCommandSelect} />

      {/* project actions */}
      {projectId && canPerformAnyCreateAction && (
        <CommandPaletteProjectActions closePalette={() => toggleCommandPaletteModal(false)} />
      )}

      {/* help options */}
      <CommandPaletteHelpActions closePalette={() => toggleCommandPaletteModal(false)} />
    </>
  );
};
