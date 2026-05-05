import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IHoIssueStore } from "@/plane-web/store/ho/ho-issue.store";

export const useHoIssues = (): IHoIssueStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useHoIssues must be used within StoreProvider");
  return (context as unknown as { hoIssue: IHoIssueStore }).hoIssue;
};
