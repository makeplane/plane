import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import { IPublishListStore } from "@/store/publish/publish_list.store";

export const usePublishList = (): IPublishListStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePublishList must be used within StoreProvider");
  return context.publishList;
};
