import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IPageTemplateStore } from "@/plane-web/store/templates/store/page.store";

export const usePageTemplates = (): IPageTemplateStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePageTemplates must be used within StoreProvider");
  return context.templatesRoot.pageTemplates;
};
