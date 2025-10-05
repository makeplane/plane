"use client";

import React from "react";
import { Command } from "cmdk";
// plane imports
import { useTranslation } from "@plane/i18n";
// local imports
import type { TPowerKCommandConfig, TPowerKCommandGroup, TPowerKContext } from "../core/types";
import { CONTEXT_ENTITY_MAP } from "./pages/context-based-actions";
import { PowerKModalCommandItem } from "./modal/command-item";

type Props = {
  commands: TPowerKCommandConfig[];
  context: TPowerKContext;
  onCommandSelect: (command: TPowerKCommandConfig) => void;
};

const groupPriority: Record<TPowerKCommandGroup, number> = {
  contextual: 1,
  create: 2,
  navigation: 3,
  general: 7,
  settings: 8,
  account: 9,
  help: 10,
};

const groupTitles: Record<TPowerKCommandGroup, string> = {
  contextual: "Contextual",
  navigation: "Navigate",
  create: "Create",
  general: "General",
  settings: "Settings",
  help: "Help",
  account: "Account",
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
              <PowerKModalCommandItem
                key={command.id}
                icon={command.icon}
                label={t(command.i18n_title)}
                keySequence={command.keySequence}
                shortcut={command.shortcut || command.modifierShortcut}
                onSelect={() => onCommandSelect(command)}
              />
            ))}
          </Command.Group>
        );
      })}
    </>
  );
};
