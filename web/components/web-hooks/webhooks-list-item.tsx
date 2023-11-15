import { FC, useState } from "react";
import { ToggleSwitch } from "@plane/ui";
import { Pencil, XCircle } from "lucide-react";
import { IWebhook } from "types";
import Link from "next/link";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

interface IWebhookListItem {
  workspaceSlug: string;
  webhook: IWebhook;
}

export const WebhooksListItem: FC<IWebhookListItem> = (props) => {
  const { workspaceSlug, webhook } = props;

  const { webhook: webhookStore }: RootStore = useMobxStore();

  const handleToggle = () => {
    if (webhook.id) {
      webhookStore.update(workspaceSlug, webhook.id, { ...webhook, is_active: !webhook.is_active }).catch(() => {});
    }
  };

  return (
    <div>
      <Link href={`/${workspaceSlug}/settings/webhooks/${webhook?.id}`}>
        <div className="flex cursor-pointer justify-between px-3.5 py-[18px]">
          <div>
            <div className="text-base font-medium">{webhook?.url || "Webhook URL"}</div>
            {/* <div className="text-base text-neutral-700">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
          </div> */}
          </div>
          <div className="flex gap-4 items-center">
            <ToggleSwitch value={webhook.is_active} onChange={handleToggle} />
          </div>
        </div>
      </Link>
    </div>
  );
};
