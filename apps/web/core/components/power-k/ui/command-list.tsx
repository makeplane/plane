"use client";

import React from "react";
import { Command } from "cmdk";
import type { TPowerKCommandConfig, TPowerKContext,    } from "../core/types";
import { CommandItem } from "./command-item";

type Props = {
  commands: TPowerKCommandConfig[];
  context: TPowerKContext;
  onSelect: (command: TPowerKCommandConfig) => void;
};

export function CommandList({ commands, context, onSelect }: Props) {
  // Separate contextual commands from general commands
  const contextualCommands = commands.filter(
    (cmd) => cmd.contextType && cmd.contextType === context.contextEntity?.type
  );
  const generalCommands = commands.filter((cmd) => !cmd.contextType);

  // Group general commands by group
  const groupedCommands = generalCommands.reduce(
    (acc, cmd) => {
      const group = cmd.group || "general";
      if (!acc[group]) acc[group] = [];
      acc[group].push(cmd);
      return acc;
    },
    {} as Record<string, TPowerKCommandConfig[]>
  );

  return (
    <>
      {/* Contextual Commands Section - Highlighted */}
      {contextualCommands.length > 0 && context.contextEntity && (
        <Command.Group
          heading={`${context.contextEntity.type.toUpperCase().replace("-", " ")} ACTIONS`}
          className="mb-2"
        >
          <div className="mb-1 px-2 text-xs font-semibold uppercase text-custom-primary-100">
            {context.contextEntity.type.toUpperCase().replace("-", " ")} ACTIONS
          </div>
          <div className="space-y-1">
            {contextualCommands.map((command) => (
              <CommandItem key={command.id} command={command} onSelect={onSelect} />
            ))}
          </div>
        </Command.Group>
      )}

      {/* General Commands - Grouped */}
      {Object.entries(groupedCommands).map(([group, cmds]) => (
        <Command.Group key={group} heading={group.toUpperCase()} className="mb-2">
          <div className="mb-1 px-2 text-xs font-semibold uppercase text-custom-text-400">{group.toUpperCase()}</div>
          <div className="space-y-1">
            {cmds.map((command) => (
              <CommandItem key={command.id} command={command} onSelect={onSelect} />
            ))}
          </div>
        </Command.Group>
      ))}

      {/* Empty State */}
      {commands.length === 0 && (
        <Command.Empty className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-custom-text-400">No commands found</p>
        </Command.Empty>
      )}
    </>
  );
}
