import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { INotionStore } from "@/plane-web/store/importers";

export const useNotionImporter = (): INotionStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useNotionImporter must be used within StoreProvider");

  return context.notionImporter;
};
