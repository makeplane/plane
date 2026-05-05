import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// type
import type { ProjectWorklogStore } from "../../store/project/worklog.store";
import type { RootStore as _RootStore } from "../../store/root.store";

export const useProjectWorklogs = (): ProjectWorklogStore => {
  const context = useContext(StoreContext) as unknown as _RootStore;
  if (context === undefined) throw new Error("useProjectWorklogs must be used within StoreProvider");
  return context.projectWorklog;
};
