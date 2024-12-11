import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IPublishPageStore } from "@/plane-web/store/pages/publish-page.store";

export const usePublishPage = (): IPublishPageStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePublishPage must be used within StoreProvider");
  return context.publishPage;
};
