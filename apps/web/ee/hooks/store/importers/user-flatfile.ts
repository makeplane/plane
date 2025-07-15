import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// types
import { IFlatfileStore } from "@/plane-web/store/importers/flatfile";

export const useFlatfileImporter = (): IFlatfileStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useFlatfileImporter must be used within StoreProvider");

  return context.flatfileImporter;
};
