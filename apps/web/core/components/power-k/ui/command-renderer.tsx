"use client";

import React from "react";
import { Command } from "cmdk";
// local imports
import type { TPowerKCommandConfig, TPowerKCommandGroup } from "../core/types";

type Props = {
  commands: TPowerKCommandConfig[];
  onCommandSelect: (command: TPowerKCommandConfig) => void;
};

const groupPriority: Record<TPowerKCommandGroup, number> = {
  navigation: 1,
  create: 2,
  project: 3,
};

const groupTitles: Record<TPowerKCommandGroup, string> = {
  navigation: "Navigate",
  create: "Work item",
  project: "Project",
  cycle: "Cycle",
  general: "General",
  settings: "Settings",
};

export const CommandRenderer: React.FC<Props> = ({ commands, onCommandSelect }) => {
  const commandsByGroup = commands.reduce(
    (acc, command) => {
      const group = command.group || "general";
      if (!acc[group]) acc[group] = [];
      acc[group].push(command);
      return acc;
    },
    {} as Record<TPowerKCommandGroup, TPowerKCommandConfig[]>
  );

  const sortedGroups = Object.keys(commandsByGroup).sort((a, b) => {
    const aPriority = groupPriority[a as TPowerKCommandGroup];
    const bPriority = groupPriority[b as TPowerKCommandGroup];
    return aPriority - bPriority;
  }) as TPowerKCommandGroup[];

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
