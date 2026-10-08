/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// hooks
import { useWebhook } from "@/hooks/store/use-webhook";
// components
import { WebhooksListItem } from "./webhooks-list-item";

export const WebhooksList = observer(function WebhooksList() {
  // store hooks
  const { webhooks } = useWebhook();

  return (
    <div className="flex size-full flex-col gap-y-2 overflow-y-auto rounded-lg border border-subtle bg-layer-1 p-3">
      {Object.values(webhooks ?? {}).map((webhook) => (
        <WebhooksListItem key={webhook.id} webhook={webhook} />
      ))}
    </div>
  );
});
