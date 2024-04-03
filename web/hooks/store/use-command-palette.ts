import { useContext } from "react";
// mobx store
import { StoreContext } from "@/contexts/store-context";
// types
import { ICommandPaletteStore } from "@/store/command-palette.store";

export const useCommandPalette = (): ICommandPaletteStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCommandPalette must be used within StoreProvider");
  return context.commandPalette;
};
