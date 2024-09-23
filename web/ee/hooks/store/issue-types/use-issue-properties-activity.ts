import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IIssuePropertiesActivityStore } from "@/plane-web/store/issue-types";

export const useIssuePropertiesActivity = (): IIssuePropertiesActivityStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssuePropertiesActivity must be used within StoreProvider");
  return context.issuePropertiesActivity;
};
