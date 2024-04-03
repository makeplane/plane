import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IProjectInboxStore } from "@/store/inbox/project-inbox.store";

export const useProjectInbox = (): IProjectInboxStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectInbox must be used within StoreProvider");
  return context.projectInbox;
};
