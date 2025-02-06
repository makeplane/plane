import { useContext } from "react";
// plane imports
import { IIssuePropertiesActivityStore } from "@plane/types";
// context
import { StoreContext } from "@/lib/store-context";

export const useIssuePropertiesActivity = (): IIssuePropertiesActivityStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssuePropertiesActivity must be used within StoreProvider");
  return context.issuePropertiesActivity;
};
