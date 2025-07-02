import { useContext } from "react";
// context
import { TCustomerModalContext, CustomerModalContext } from "@/plane-web/components/customers";

export const useCustomerModal = (): TCustomerModalContext => {
  const context = useContext(CustomerModalContext);
  if (context === undefined) throw new Error("useIssueModal must be used within IssueModalProvider");
  return context;
};
