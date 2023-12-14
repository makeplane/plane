import { useContext } from "react";
// mobx store
import { MobxStoreContext } from "lib/mobx/store-provider";
// types
import { IWebhookStore } from "store/workspace/webhook.store";

export const useWebhook = (): IWebhookStore => {
  const context = useContext(MobxStoreContext);
  if (context === undefined) throw new Error("useMobxStore must be used within MobxStoreProvider");
  return context.workspaceRoot.webhook;
};
