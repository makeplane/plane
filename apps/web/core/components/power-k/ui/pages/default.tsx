"use client";

import React from "react";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// local imports
import type { TPowerKCommandConfig, TPowerKContext } from "../../core/types";
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

  return <CommandRenderer context={context} commands={commands} onCommandSelect={onCommandSelect} />;
};
