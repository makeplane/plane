import { useContext } from "react";
// todesktop
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
// context
import { DesktopAppContext, TDesktopAppContext } from "./context";

export const useDesktopApp = (): TDesktopAppContext => {
  if (!isDesktopApp()) throw new Error("useDesktopApp must be used in desktop app");
  const context = useContext(DesktopAppContext);
  if (context === undefined) throw new Error("useDesktopApp must be used within IssueModalProvider");
  return context;
};
