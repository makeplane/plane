import { useContext } from "react";
// plane imports
import { IIssueTypesStore } from "@plane/types";
// context
import { StoreContext } from "@/lib/store-context";

export const useIssueTypes = (): IIssueTypesStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssueTypes must be used within StoreProvider");

  return context.issueTypes;
};
