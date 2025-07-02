import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IWorkItemTemplateStore } from "@/plane-web/store/templates/store/work-item.store";

export const useWorkItemTemplates = (): IWorkItemTemplateStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkItemTemplates must be used within StoreProvider");
  return context.templatesRoot.workItemTemplates;
};
