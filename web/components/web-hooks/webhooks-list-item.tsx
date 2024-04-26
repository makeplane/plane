import { FC } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { IWebhook } from "@plane/types";
// hooks
import { ToggleSwitch } from "@plane/ui";
// constants
import { WEBHOOK_DISABLED, WEBHOOK_ENABLED } from "@/constants/event-tracker";
import { useWebhook, useEventTracker } from "@/hooks/store";
// ui
// types

interface IWebhookListItem {
  webhook: IWebhook;
}

export const WebhooksListItem: FC<IWebhookListItem> = (props) => {
  const { webhook } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { updateWebhook } = useWebhook();
  const { captureEvent } = useEventTracker();

  const handleToggle = () => {
    if (!workspaceSlug || !webhook.id) return;

    updateWebhook(workspaceSlug.toString(), webhook.id, { is_active: !webhook.is_active }).then(() =>
      captureEvent(!webhook.is_active ? WEBHOOK_ENABLED : WEBHOOK_DISABLED, {
        webhook_id: webhook.id,
      })
    );
  };

  return (
    <div className="border-b border-custom-border-200">
      <Link href={`/${workspaceSlug}/settings/webhooks/${webhook?.id}`}>
        <span className="flex items-center justify-between gap-4 px-3.5 py-[18px]">
          <h5 className="truncate text-base font-medium">{webhook.url}</h5>
          <ToggleSwitch value={webhook.is_active} onChange={handleToggle} />
        </span>
      </Link>
    </div>
  );
};
