import { useContext } from "react";
// store
import { StoreContext } from "@/contexts/store-context";
import { IThemeStore } from "@/store/theme.store";

export const useAppTheme = (): IThemeStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useAppTheme must be used within StoreProvider");
  return context.theme;
};
