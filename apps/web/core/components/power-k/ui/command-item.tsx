"use client";

import React from "react";
import { Command } from "cmdk";
import type { TPowerKCommandConfig } from "../core/types";
import { ShortcutBadge, KeySequenceBadge } from "../utils/format-shortcut";

type Props = {
  command: TPowerKCommandConfig;
  onSelect: (command: TPowerKCommandConfig) => void;
};

export function CommandItem({ command, onSelect }: Props) {
  const Icon = command.icon;

  return (
    <Command.Item
      key={command.id}
      value={`${command.title} ${command.description || ""} ${command.searchTerms?.join(" ") || ""}`}
      onSelect={() => onSelect(command)}
      className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-custom-background-80 aria-selected:bg-custom-background-80"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-custom-text-300" />}
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-custom-text-100">{command.title}</span>
          {command.description && <span className="truncate text-xs text-custom-text-400">{command.description}</span>}
        </div>
      </div>

      <div className="flex-shrink-0">
        {command.modifierShortcut ? (
          <ShortcutBadge shortcut={command.modifierShortcut} />
        ) : command.keySequence ? (
          <KeySequenceBadge sequence={command.keySequence} />
        ) : command.shortcut ? (
          <ShortcutBadge shortcut={command.shortcut} />
        ) : null}
      </div>
    </Command.Item>
  );
}
