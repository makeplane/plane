import React from "react";

export interface PaletteCommand {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ComponentType<{ className?: string }>;
  perform: () => void;
  enabled?: boolean;
}

export interface PaletteCommandGroup {
  id: string;
  heading: string;
  commands: PaletteCommand[];
}
