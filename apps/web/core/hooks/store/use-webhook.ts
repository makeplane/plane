import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { IWebhookStore } from "@/store/workspace/webhook.store";

export const useWebhook = (): IWebhookStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWebhook must be used within StoreProvider");
  return context.workspaceRoot.webhook;
};
