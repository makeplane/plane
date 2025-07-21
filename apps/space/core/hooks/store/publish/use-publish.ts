import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import { PublishStore } from "@/store/publish/publish.store";

export const usePublish = (anchor: string): PublishStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePublish must be used within StoreProvider");
  return context.publishList.publishMap?.[anchor] ?? {};
};
