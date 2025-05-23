import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ITemplateHelperStore } from "@/plane-web/store/templates/store/helper.store";

export const useTemplateHelper = (): ITemplateHelperStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTemplateHelper must be used within StoreProvider");
  return context.templatesRoot.templateHelper;
};
