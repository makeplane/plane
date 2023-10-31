import { FC } from "react";
import Link from "next/link";
import { Button } from "@plane/ui";
import { WebhooksListItem } from "./webhooks-list-item";
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { observer } from "mobx-react-lite";

interface IWebHookLists {
  workspaceSlug: string;
}

export const WebhookLists: FC<IWebHookLists> = observer((props) => {
  const { workspaceSlug } = props;
  const { webhook: webhookStore }: RootStore = useMobxStore();

  return (
    <>
      <div className="flex items-center justify-between gap-4 py-3.5 border-b border-custom-border-200">
        <h4 className="text-xl font-medium">Webhooks</h4>
        <Link href={`/${workspaceSlug}/settings/webhooks/create`}>
          <Button variant="primary" size="sm">
            Add webhook
          </Button>
        </Link>
      </div>
      {/* List */}
      <div className="divide-y divide-custom-border-200 overflow-y-scroll">
        {webhookStore.webhooks.map((item, index) => (
          <WebhooksListItem workspaceSlug={workspaceSlug} webhook={item} />
        ))}
      </div>
    </>
  );
});
