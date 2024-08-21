import { useContext } from "react";
// context
import { IssueModalContext, TIssueModalContext } from "@/components/issues";

export const useIssueModal = (): TIssueModalContext => {
  const context = useContext(IssueModalContext);
  if (context === undefined) throw new Error("useIssueModal must be used within IssueModalProvider");
  return context;
};
