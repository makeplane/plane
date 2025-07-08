import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IProjectTemplateStore } from "@/plane-web/store/templates/store/project.store";

export const useProjectTemplates = (): IProjectTemplateStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectTemplates must be used within StoreProvider");
  return context.templatesRoot.projectTemplates;
};
