import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IIssueTypesStore } from "@/plane-web/store/issue-types";

export const useIssueTypes = (): IIssueTypesStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssueTypes must be used within StoreProvider");

  return context.issueTypes;
};
