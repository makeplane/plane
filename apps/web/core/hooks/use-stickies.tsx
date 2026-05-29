import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
import type { IStickyStore } from "@/store/sticky/sticky.store";
// plane web stores

export const useSticky = (): IStickyStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useSticky must be used within StoreProvider");
  return context.stickyStore;
};
