import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { ICommandPaletteStore } from "@/plane-web/store/command-palette.store";

export const useCommandPalette = (): ICommandPaletteStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCommandPalette must be used within StoreProvider");
  return context.commandPalette;
};
