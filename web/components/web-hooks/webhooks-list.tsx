import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { WebhooksListItem } from "./webhooks-list-item";

export const WebhooksList = observer(() => {
  const {
    webhook: { webhooks },
  } = useMobxStore();

  return (
    <div className="h-full w-full overflow-y-auto">
      {Object.values(webhooks ?? {}).map((webhook) => (
        <WebhooksListItem key={webhook.id} webhook={webhook} />
      ))}
    </div>
  );
});
