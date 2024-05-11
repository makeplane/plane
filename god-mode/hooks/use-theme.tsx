import { useContext } from "react";
// mobx store
import { ThemeContext } from "lib/theme-provider";
// types
import { IThemeStore } from "store/theme.store";

export const useAppTheme = (): IThemeStore => {
  const context = useContext(ThemeContext);
  if (context === undefined)
    throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

export default useAppTheme;
