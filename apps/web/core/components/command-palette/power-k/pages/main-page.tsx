"use client";

import React from "react";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser } from "@/hooks/store/user";
// local imports
import { CommandRenderer } from "../../command-renderer";
import { CommandPaletteHelpActions, CommandPaletteIssueActions } from "../actions";
import { PowerKModalCreateActionsMenu } from "../actions/create-actions";
import { useCommandRegistry } from "../hooks";
import type { CommandConfig, CommandContext, CommandExecutionContext } from "../types";

type Props = {
  context: CommandContext;
  executionContext: CommandExecutionContext;
  projectId: string | undefined;
  issueId: string | undefined;
  issueDetails: { id: string; project_id: string | null; name?: string } | null;
  searchInIssue: boolean;
  pages: string[];
  setPages: (pages: string[] | ((prev: string[]) => string[])) => void;
  setPlaceholder: (placeholder: string) => void;
  setSearchTerm: (term: string) => void;
  onCommandSelect: (command: CommandConfig) => void;
};

export const MainPage: React.FC<Props> = (props) => {
  const {
    context,
    executionContext,
    projectId,
    issueId,
    issueDetails,
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

      {/* project actions */}
      {projectId && canPerformAnyCreateAction && <PowerKModalCreateActionsMenu executionContext={executionContext} />}

      {/* New command renderer */}
      <CommandRenderer commands={registry.getVisibleCommands(context)} onCommandSelect={onCommandSelect} />

      {/* help options */}
      <CommandPaletteHelpActions closePalette={() => toggleCommandPaletteModal(false)} />
    </>
  );
};
