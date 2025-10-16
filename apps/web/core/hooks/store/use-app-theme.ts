import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-context";
import type { IThemeStore } from "@/store/theme.store";

export const useAppTheme = (): IThemeStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useAppTheme must be used within StoreProvider");
  return context.theme;
};
