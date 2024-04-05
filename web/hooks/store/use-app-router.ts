import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-context";
import { IRouterStore } from "@/store/router.store";

export const useAppRouter = (): IRouterStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useAppRouter must be used within StoreProvider");
  return context.router;
};
