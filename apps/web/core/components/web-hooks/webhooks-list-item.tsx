"use client";

import { FC } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IWebhook } from "@plane/types";
// hooks
import { ToggleSwitch } from "@plane/ui";
import { useWebhook } from "@/hooks/store";
// ui
// types

interface IWebhookListItem {
  webhook: IWebhook;
}

export const WebhooksListItem: FC<IWebhookListItem> = (props) => {
  const { webhook } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { updateWebhook } = useWebhook();

  const handleToggle = () => {
    if (!workspaceSlug || !webhook.id) return;

    updateWebhook(workspaceSlug.toString(), webhook.id, { is_active: !webhook.is_active });
  };

  return (
    <div className="border-b border-custom-border-200">
      <Link href={`/${workspaceSlug}/settings/webhooks/${webhook?.id}`}>
        <span className="flex items-center justify-between gap-4 py-[18px]">
          <h5 className="truncate text-base font-medium">{webhook.url}</h5>
          <ToggleSwitch value={webhook.is_active} onChange={handleToggle} />
        </span>
      </Link>
    </div>
  );
};
