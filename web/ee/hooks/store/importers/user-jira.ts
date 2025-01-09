import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IJiraStore } from "@/plane-web/store/importers";

export const useJiraImporter = (): IJiraStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useJiraImporter must be used within StoreProvider");

  return context.jiraImporter;
};
