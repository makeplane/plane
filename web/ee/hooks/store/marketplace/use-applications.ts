import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IApplicationStore } from "@/plane-web/store/marketplace/application.store";

export const useApplications = (): IApplicationStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useApplications must be used within StoreProvider");
  return context.applicationStore;
};
