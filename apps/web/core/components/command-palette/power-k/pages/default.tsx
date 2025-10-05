"use client";

import React from "react";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// local imports
import { CommandRenderer } from "../../command-renderer";
import { CommandPaletteHelpActions } from "../actions";
import { useCommandRegistry } from "../hooks";
import type { CommandConfig, CommandContext } from "../types";

type Props = {
  context: CommandContext;
  onCommandSelect: (command: CommandConfig) => void;
};

export const PowerKModalDefaultPage: React.FC<Props> = (props) => {
  const { context, onCommandSelect } = props;
  // store hooks
  const { toggleCommandPaletteModal } = useCommandPalette();
  const { registry } = useCommandRegistry();

  return (
    <>
      {/* New command renderer */}
      <CommandRenderer commands={registry.getVisibleCommands(context)} onCommandSelect={onCommandSelect} />

      {/* help options */}
      <CommandPaletteHelpActions closePalette={() => toggleCommandPaletteModal(false)} />
    </>
  );
};
