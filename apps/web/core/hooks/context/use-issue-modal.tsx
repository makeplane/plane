import { useContext } from "react";
// components
import { IssueModalContext, type TIssueModalContext } from "@/components/issues/issue-modal/context";

export const useIssueModal = (): TIssueModalContext => {
  const context = useContext(IssueModalContext);
  if (context === undefined) throw new Error("useIssueModal must be used within IssueModalProvider");
  return context;
};
