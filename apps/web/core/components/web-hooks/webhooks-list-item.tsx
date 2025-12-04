import type { FC } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { WORKSPACE_SETTINGS_TRACKER_ELEMENTS, WORKSPACE_SETTINGS_TRACKER_EVENTS } from "@plane/constants";
import type { IWebhook } from "@plane/types";
// hooks
import { ToggleSwitch } from "@plane/ui";
import { captureElementAndEvent } from "@/helpers/event-tracker.helper";
import { useWebhook } from "@/hooks/store/use-webhook";
// ui
// types

interface IWebhookListItem {
  webhook: IWebhook;
}

export function WebhooksListItem(props: IWebhookListItem) {
  const { webhook } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { updateWebhook } = useWebhook();

  const handleToggle = () => {
    if (!workspaceSlug || !webhook.id) return;
    updateWebhook(workspaceSlug.toString(), webhook.id, { is_active: !webhook.is_active })
      .then(() => {
        captureElementAndEvent({
          element: {
            elementName: WORKSPACE_SETTINGS_TRACKER_ELEMENTS.WEBHOOK_LIST_ITEM_TOGGLE_SWITCH,
          },
          event: {
            eventName: WORKSPACE_SETTINGS_TRACKER_EVENTS.webhook_toggled,
            state: "SUCCESS",
            payload: {
              webhook: webhook.url,
            },
          },
        });
      })
      .catch(() => {
        captureElementAndEvent({
          element: {
            elementName: WORKSPACE_SETTINGS_TRACKER_ELEMENTS.WEBHOOK_LIST_ITEM_TOGGLE_SWITCH,
          },
          event: {
            eventName: WORKSPACE_SETTINGS_TRACKER_EVENTS.webhook_toggled,
            state: "ERROR",
            payload: {
              webhook: webhook.url,
            },
          },
        });
      });
  };

  return (
    <div className="border-b border-subtle">
      <Link href={`/${workspaceSlug}/settings/webhooks/${webhook?.id}`}>
        <span className="flex items-center justify-between gap-4 py-[18px]">
          <h5 className="truncate text-14 font-medium">{webhook.url}</h5>
          <ToggleSwitch value={webhook.is_active} onChange={handleToggle} />
        </span>
      </Link>
    </div>
  );
}
