"use client";

import React from "react";
import { Command } from "cmdk";
// local imports
import type { CommandConfig, CommandGroup as CommandGroupType } from "./power-k/types";

type Props = {
  commands: CommandConfig[];
  onCommandSelect: (command: CommandConfig) => void;
};

const groupPriority: Record<CommandGroupType, number> = {
  navigate: 1,
  create: 2,
  project: 3,
  workspace: 4,
  account: 5,
  help: 6,
  contextual: 7,
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
              <Command.Item key={command.id} onSelect={() => onCommandSelect(command)} className="focus:outline-none">
                <div className="flex items-center gap-2 text-custom-text-200">
                  {command.icon && <command.icon className="shrink-0 size-3.5" />}
                  {command.title}
                </div>
                {(command.shortcut || command.keySequence) && (
                  <div className="flex items-center gap-1">
                    {command.keySequence ? (
                      command.keySequence.split("").map((key, index) => <kbd key={index}>{key.toUpperCase()}</kbd>)
                    ) : (
                      <kbd>{command.shortcut?.toUpperCase()}</kbd>
                    )}
                  </div>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        );
      })}
    </>
  );
};
