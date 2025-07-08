import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IClickUpStore } from "@/plane-web/store/importers";

export const useClickUpImporter = (): IClickUpStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useClickUpImporter must be used within StoreProvider");

  return context.clickupImporter;
};
