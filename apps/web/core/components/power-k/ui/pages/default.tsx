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
};

export const PowerKModalDefaultPage: React.FC<Props> = (props) => {
  const { context, onCommandSelect } = props;
  // store hooks
  const { getCommandRegistryV2 } = useCommandPalette();
  // Get registry and commands from store
  const commandRegistry = getCommandRegistryV2();
  // Get commands to display
  const commands = commandRegistry.getVisibleCommands(context);

  console.log("all commands", commandRegistry.getAllCommands());
  console.log("visible commands", commands);

  return (
    <>
      {/* New command renderer */}
      <CommandRenderer commands={commands} onCommandSelect={onCommandSelect} />

      {/* help options */}
      {/* <CommandPaletteHelpActions closePalette={() => toggleCommandPaletteModal(false)} /> */}
    </>
  );
};
