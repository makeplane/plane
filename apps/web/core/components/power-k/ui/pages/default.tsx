"use client";

import React from "react";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// local imports
import { TPowerKCommandConfig, TPowerKContext } from "../../core/types";
import { CommandRenderer } from "../command-renderer";

type Props = {
  context: TPowerKContext;
  onCommandSelect: (command: TPowerKCommandConfig) => void;
  searchTerm: string;
};

export const PowerKModalDefaultPage: React.FC<Props> = (props) => {
  const { context, onCommandSelect, searchTerm } = props;
  // store hooks
  const { getCommandRegistryV2 } = useCommandPalette();
  // Get registry and commands from store
  const commandRegistry = getCommandRegistryV2();
  // Get commands to display
  const commands = searchTerm
    ? commandRegistry.search(searchTerm, context)
    : commandRegistry.getVisibleCommands(context);

  return (
    <>
      {/* New command renderer */}
      <CommandRenderer commands={commands} onCommandSelect={onCommandSelect} />

      {/* help options */}
      {/* <CommandPaletteHelpActions closePalette={() => toggleCommandPaletteModal(false)} /> */}
    </>
  );
};
