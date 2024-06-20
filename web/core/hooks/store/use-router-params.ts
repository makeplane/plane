import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-context";
import { IRouterStore } from "@/store/router.store";

export const useRouterParams = (): IRouterStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useRouterParams must be used within StoreProvider");
  return context.router;
};
