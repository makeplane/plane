import React from "react";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
// local imports
import type { TPowerKCommandConfig, TPowerKContext } from "../../core/types";
import { CommandRenderer } from "../renderer/command";

type Props = {
  context: TPowerKContext;
  onCommandSelect: (command: TPowerKCommandConfig) => void;
};

export function PowerKModalDefaultPage(props: Props) {
  const { context, onCommandSelect } = props;
  // store hooks
  const { commandRegistry } = usePowerK();
  // Get commands to display
  const commands = commandRegistry.getVisibleCommands(context);

  return <CommandRenderer context={context} commands={commands} onCommandSelect={onCommandSelect} />;
}
