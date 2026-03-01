/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import Link from "next/link";
import { useParams } from "next/navigation";
// Plane imports
import type { IWebhook } from "@plane/types";
import { Switch } from "@plane/propel/switch";
// hooks
import { useWebhook } from "@/hooks/store/use-webhook";

interface IWebhookListItem {
  webhook: IWebhook;
}

export function WebhooksListItem(props: IWebhookListItem) {
  const { webhook } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { updateWebhook } = useWebhook();

  const handleToggle = async () => {
    if (!workspaceSlug || !webhook.id) return;
    await updateWebhook(workspaceSlug.toString(), webhook.id, { is_active: !webhook.is_active });
  };

  return (
    <div className="bg-layer-2 border border-subtle px-4 py-3 rounded-lg">
      <Link
        href={`/${workspaceSlug}/settings/webhooks/${webhook?.id}`}
        className="flex items-center justify-between gap-4"
      >
        <h5 className="text-body-sm-medium truncate">{webhook.url}</h5>
        <div className="shrink-0">
          <Switch value={webhook.is_active} onChange={handleToggle} />
        </div>
      </Link>
    </div>
  );
}
