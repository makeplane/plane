import { useContext } from "react";
import { AppRootStoreContext } from "./app-root-provider";

export const useAppRoot = () => {
  const context = useContext(AppRootStoreContext);
  if (context === undefined) throw new Error("useAppRoot must be used within AppRootStoreContext");
  return context;
};
