import React from "react";
import { Button } from "@plane/ui";
import { WebhooksListItem } from "./webhooks-list-item";

export const WebhookLists = () => {
  return (
    <div className="pr-9 py-8 w-full overflow-y-auto">
      <div className="flex items-center justify-between gap-4 py-3.5 border-b border-custom-border-200">
        <h4 className="text-xl font-medium">Webhooks</h4>
        <Button variant="primary" size="sm">
          Add webhook
        </Button>
      </div>
      {/* List */}
      <div className="divide-y divide-custom-border-200">
        <WebhooksListItem />
        <WebhooksListItem />
        <WebhooksListItem />
        <WebhooksListItem />
        <WebhooksListItem />
        <WebhooksListItem />
      </div>
    </div>
  );
};
