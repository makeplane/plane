import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IBacklogStore } from "@/store/backlog.store";

export const useBacklog = (): IBacklogStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useBacklog must be used within StoreProvider");
  return context.backlog;
};

