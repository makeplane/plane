// types
import { TCommandPaletteActionList, TCommandPaletteShortcut, TCommandPaletteShortcutList } from "@plane/types";
// ce helpers
import {
  getGlobalShortcutsList as getGlobalShortcutsListCE,
  getWorkspaceShortcutsList as getWorkspaceShortcutsListCE,
  getProjectShortcutsList as getProjectShortcutsListCE,
  getNavigationShortcutsList as getNavigationShortcutsListCE,
  getCommonShortcutsList as getCommonShortcutsListCE,
} from "@/ce/helpers/command-palette";

export const getGlobalShortcutsList: () => TCommandPaletteActionList = () => ({
  ...getGlobalShortcutsListCE(),
});

export const getWorkspaceShortcutsList: () => TCommandPaletteActionList = () => ({
  ...getWorkspaceShortcutsListCE(),
});

export const getProjectShortcutsList: () => TCommandPaletteActionList = () => ({
  ...getProjectShortcutsListCE(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handleAdditionalKeyDownEvents = (e: KeyboardEvent) => null;

export const getNavigationShortcutsList = (): TCommandPaletteShortcut[] => [...getNavigationShortcutsListCE()];

export const getCommonShortcutsList = (platform: string): TCommandPaletteShortcut[] => [
  ...getCommonShortcutsListCE(platform),
];

export const getAdditionalShortcutsList = (): TCommandPaletteShortcutList[] => [];
