"use client";

import React from "react";
import { Command } from "cmdk";
// plane imports
import { useTranslation } from "@plane/i18n";
// local imports
import type { TPowerKCommandConfig, TPowerKCommandGroup, TPowerKContext } from "../core/types";
import { CONTEXT_ENTITY_MAP } from "./pages/context-based-actions";

type Props = {
  commands: TPowerKCommandConfig[];
  context: TPowerKContext;
  onCommandSelect: (command: TPowerKCommandConfig) => void;
};

const groupPriority: Record<TPowerKCommandGroup, number> = {
  contextual: 1,
  navigation: 2,
  create: 3,
  general: 7,
  settings: 8,
};

const groupTitles: Record<TPowerKCommandGroup, string> = {
  contextual: "Contextual",
  navigation: "Navigate",
  create: "Create",
  general: "General",
  settings: "Settings",
};

export const CommandRenderer: React.FC<Props> = (props) => {
  const { commands, context, onCommandSelect } = props;
  // derived values
  const { activeContext } = context;
  // translation
  const { t } = useTranslation();

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

        const title =
          groupKey === "contextual" && activeContext
            ? t(CONTEXT_ENTITY_MAP[activeContext].i18n_title)
            : groupTitles[groupKey];

        return (
          <Command.Group key={groupKey} heading={title}>
            {groupCommands.map((command) => (
              <Command.Item key={command.id} onSelect={() => onCommandSelect(command)} className="focus:outline-none">
                <div className="flex items-center gap-2 text-custom-text-200">
                  {command.icon && <command.icon className="shrink-0 size-3.5" />}
                  {t(command.i18n_title)}
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
