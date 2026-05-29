import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { ISupportTicketStore } from "@/store/support-ticket.store";

export const useSupportTicket = (): ISupportTicketStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useSupportTicket must be used within StoreProvider");
  return context.supportTicket;
};
