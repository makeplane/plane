import { useContext } from "react";
import { AppRailContext } from "./context/app-rail-context";

export const useAppRail = () => {
  const context = useContext(AppRailContext);
  if (context === undefined) {
    throw new Error("useAppRail must be used within AppRailProvider");
  }
  return context;
};
