"use client";

import React from "react";
import { Command } from "cmdk";
// local imports
import { PowerKModalCommandItem } from "./power-k/modal/command-item";
import type { CommandConfig, CommandGroup as CommandGroupType } from "./power-k/types";

type Props = {
  commands: CommandConfig[];
  onCommandSelect: (command: CommandConfig) => void;
};

const groupPriority: Record<CommandGroupType, number> = {
  contextual: 1,
  create: 2,
  navigate: 3,
  project: 4,
  workspace: 5,
  account: 6,
  help: 7,
};

const groupTitles: Record<CommandGroupType, string> = {
  navigate: "Navigate",
  create: "Work item",
  project: "Project",
  workspace: "Workspace settings",
  account: "Account",
  help: "Help",
  contextual: "Actions",
};

export const CommandRenderer: React.FC<Props> = ({ commands, onCommandSelect }) => {
  const commandsByGroup = commands.reduce(
    (acc, command) => {
      const group = command.group || "help";
      if (!acc[group]) acc[group] = [];
      acc[group].push(command);
      return acc;
    },
    {} as Record<CommandGroupType, CommandConfig[]>
  );

  const sortedGroups = Object.keys(commandsByGroup).sort((a, b) => {
    const aPriority = groupPriority[a as CommandGroupType];
    const bPriority = groupPriority[b as CommandGroupType];
    return aPriority - bPriority;
  }) as CommandGroupType[];

  return (
    <>
      {sortedGroups.map((groupKey) => {
        const groupCommands = commandsByGroup[groupKey];
        if (!groupCommands || groupCommands.length === 0) return null;

        return (
          <Command.Group key={groupKey} heading={groupTitles[groupKey]}>
            {groupCommands.map((command) => (
              <PowerKModalCommandItem
                key={command.id}
                icon={command.icon}
                keySequence={command.keySequence}
                label={command.title}
                onSelect={() => onCommandSelect(command)}
                shortcut={command.shortcut}
              />
            ))}
          </Command.Group>
        );
      })}
    </>
  );
};
