import { useContext } from "react";
// mobx store
import { InstanceContext } from "lib/instance-provider";
// types
import { IInstanceStore } from "store/instance.store";

export const useInstance = (): IInstanceStore => {
  const context = useContext(InstanceContext);
  if (context === undefined)
    throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
