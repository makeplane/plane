import { useContext } from "react";
// providers
import { StoreContext } from "@/lib/store-provider";
// plane web stores
import { IPage } from "@/plane-web/store/pages";

export const usePage = (anchor: string | undefined): IPage | undefined => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePage must be used within StoreProvider");
  if (!anchor) return undefined;
  return context.pagesListStore.data?.[anchor] ?? undefined;
};
