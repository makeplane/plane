import type { ReactNode } from "react";

export type CommandAction = {
  id: string;
  keys: string[]; // key sequence
  run: () => void;
  enabled?: () => boolean;
  group?: string; // grouping label for palette display
  label?: string; // user visible label
  shortcut?: string; // display shortcut key
  icon?: ReactNode; // optional icon for display
  showInPalette?: boolean; // show in command modal
};

export type CommandGroupMap = Record<string, CommandAction[]>;

export const groupCommands = (commands: CommandAction[]): CommandGroupMap =>
  commands.reduce((acc, cmd) => {
    if (!cmd.group || cmd.showInPalette === false) return acc;
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as CommandGroupMap);

export const matchSequence = (sequence: string[], keys: string[]): boolean => {
  if (sequence.length !== keys.length) return false;
  return sequence.every((key, idx) => key === keys[idx]);
};

export const isSequencePrefix = (sequence: string[], keys: string[]): boolean => {
  if (keys.length > sequence.length) return false;
  return keys.every((key, idx) => sequence[idx] === key);
};
