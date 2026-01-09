import { observer } from "mobx-react";
// hooks
import { useWebhook } from "@/hooks/store/use-webhook";
// components
import { WebhooksListItem } from "./webhooks-list-item";

export const WebhooksList = observer(function WebhooksList() {
  // store hooks
  const { webhooks } = useWebhook();

  return (
    <div className="size-full bg-layer-1 p-3 rounded-lg border border-subtle flex flex-col gap-y-2 overflow-y-auto">
      {Object.values(webhooks ?? {}).map((webhook) => (
        <WebhooksListItem key={webhook.id} webhook={webhook} />
      ))}
    </div>
  );
});
