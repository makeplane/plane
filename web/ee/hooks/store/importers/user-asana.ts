import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IAsanaStore } from "@/plane-web/store/importers";

export const useAsanaImporter = (): IAsanaStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useAsanaImporter must be used within StoreProvider");

  return context.asanaImporter;
};
