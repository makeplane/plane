import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IJiraServerStore } from "@/plane-web/store/importers";

export const useJiraServerImporter = (): IJiraServerStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useJiraServerImporter must be used within StoreProvider");

  return context.jiraServerImporter;
};
