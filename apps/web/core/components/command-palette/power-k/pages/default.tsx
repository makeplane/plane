"use client";

import React from "react";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser } from "@/hooks/store/user";
// local imports
import { CommandRenderer } from "../../command-renderer";
import { CommandPaletteHelpActions } from "../actions";
import { PowerKModalCreateActionsMenu } from "../actions/create-actions";
import { useCommandRegistry } from "../hooks";
import type { CommandConfig, CommandContext, CommandExecutionContext, TPowerKPageKeys } from "../types";

type Props = {
  context: CommandContext;
  executionContext: CommandExecutionContext;
  projectId: string | undefined;
  onCommandSelect: (command: CommandConfig) => void;
};

export const PowerKModalDefaultPage: React.FC<Props> = (props) => {
  const { context, executionContext, projectId, onCommandSelect } = props;
  // store hooks
  const { toggleCommandPaletteModal } = useCommandPalette();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { canPerformAnyCreateAction } = useUser();
  const { registry } = useCommandRegistry();

  return (
    <>
      {/* project actions */}
      {projectId && canPerformAnyCreateAction && <PowerKModalCreateActionsMenu executionContext={executionContext} />}

      {/* New command renderer */}
      <CommandRenderer commands={registry.getVisibleCommands(context)} onCommandSelect={onCommandSelect} />

      {/* help options */}
      <CommandPaletteHelpActions closePalette={() => toggleCommandPaletteModal(false)} />
    </>
  );
};
