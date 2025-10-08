import type { CommandPaletteEntity } from "@/store/base-command-palette.store";

export interface CommandConfig {
  /**
   * Unique identifier for the command
   */
  id: string;
  /**
   * Key sequence that triggers the command. Should be lowercase.
   */
  sequence: string;
  /**
   * Display label shown in the command palette.
   */
  title: string;
  /**
   * Keys displayed as shortcut hint.
   */
  keys: string[];
  /**
   * Entity that the command opens.
   */
  entity: CommandPaletteEntity;
  /**
   * Optional predicate controlling command availability
   */
  enabled?: () => boolean;
}

export const COMMAND_CONFIG: CommandConfig[] = [
  {
    id: "open-project",
    sequence: "op",
    title: "Open project...",
    keys: ["O", "P"],
    entity: "project",
  },
  {
    id: "open-cycle",
    sequence: "oc",
    title: "Open cycle...",
    keys: ["O", "C"],
    entity: "cycle",
  },
  {
    id: "open-issue",
    sequence: "oi",
    title: "Open issue...",
    keys: ["O", "I"],
    entity: "issue",
  },
];
