import { observer } from "mobx-react-lite";
// hooks
import { useWebhook } from "hooks/store";
// components
import { WebhooksListItem } from "./webhooks-list-item";

export const WebhooksList = observer(() => {
  // store hooks
  const { webhooks } = useWebhook();

  return (
    <div className="h-full w-full overflow-y-auto">
      {Object.values(webhooks ?? {}).map((webhook) => (
        <WebhooksListItem key={webhook.id} webhook={webhook} />
      ))}
    </div>
  );
});
