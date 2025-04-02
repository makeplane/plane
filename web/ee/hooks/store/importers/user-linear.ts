import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { ILinearStore } from "@/plane-web/store/importers";

export const useLinearImporter = (): ILinearStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useLinearImporter must be used within StoreProvider");

  return context.linearImporter;
};
