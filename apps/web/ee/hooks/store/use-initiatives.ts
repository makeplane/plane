import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IInitiativeFilterStore } from "@/plane-web/store/initiatives/initiatives-filter.store";
import { IInitiativeStore } from "@/plane-web/store/initiatives/initiatives.store";

export const useInitiatives = (): { initiative: IInitiativeStore; initiativeFilters: IInitiativeFilterStore } => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInitiatives must be used within StoreProvider");

  return {
    initiative: context.initiativeStore,
    initiativeFilters: context.initiativeFilterStore,
  };
};
