export type TCommandPaletteActionList = Record<string, { title: string; description: string; action: () => void }>;

export type TCommandPaletteShortcutList = {
  key: string;
  title: string;
  shortcuts: TCommandPaletteShortcut[];
};

export type TCommandPaletteShortcut = {
  keys: string; // comma separated keys
  description: string;
};
