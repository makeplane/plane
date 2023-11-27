import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { WebhooksListItem } from "./webhooks-list-item";
// ui
import { Button } from "@plane/ui";

export const WebhooksList = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    webhook: { webhooks },
  } = useMobxStore();

  return (
    <>
      <div className="flex items-center justify-between gap-4 pb-3.5 border-b border-custom-border-200">
        <div className="text-xl font-medium">Webhooks</div>
        <Link href={`/${workspaceSlug}/settings/webhooks/create`}>
          <Button variant="primary" size="sm">
            Add webhook
          </Button>
        </Link>
      </div>

      <div className="overflow-y-scroll">
        {Object.values(webhooks ?? {}).map((webhook) => (
          <WebhooksListItem key={webhook.id} webhook={webhook} />
        ))}
      </div>
    </>
  );
});
