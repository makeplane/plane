import { FC } from "react";
import Link from "next/link";
import { Button } from "@plane/ui";
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { observer } from "mobx-react-lite";
// components
import { WebhooksListItem } from "./webhooks-list-item";

interface IWebHookLists {
  workspaceSlug: string;
}

export const WebhookLists: FC<IWebHookLists> = observer((props) => {
  const { workspaceSlug } = props;
  const {
    webhook: { webhooks },
  }: RootStore = useMobxStore();

  return (
    <>
      <div className="flex items-center justify-between gap-4 py-3.5 border-b border-custom-border-200">
        <div className="text-xl font-medium">Webhooks</div>
        <Link href={`/${workspaceSlug}/settings/webhooks/create`}>
          <Button variant="primary" size="sm">
            Add webhook
          </Button>
        </Link>
      </div>

      <div className="divide-y divide-custom-border-200 overflow-y-scroll">
        {Object.values(webhooks).map((item) => (
          <WebhooksListItem workspaceSlug={workspaceSlug} webhook={item} key={item.id} />
        ))}
      </div>
    </>
  );
});
