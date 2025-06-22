import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
import { IProjectInboxStore } from "@/plane-web/store/project-inbox.store";

export const useProjectInbox = (): IProjectInboxStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectInbox must be used within StoreProvider");
  return context.projectInbox;
};
