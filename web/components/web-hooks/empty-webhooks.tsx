import React from "react";
import { Button } from "@plane/ui";
import Image from "next/image";
import EmptyWebhookLogo from "public/empty-state/issue.svg";

export const EmptyWebhooks = () => {
  return (
    <div className="flex items-start justify-center">
      <div className="flex p-10 flex-col items-center justify-center rounded-[4px] border border-neutral-200 bg-neutral-50">
        <Image width="178" height="116" src={EmptyWebhookLogo} alt="empty-webhook image" />

        <h3 className="mt-4 text-base font-semibold">No Webhooks yet</h3>
        <p className="text-sm text-neutral-600">Create labels to help organize and filter issues in your project</p>
        <Button variant="primary" className="mt-2">
          Add Webhook
        </Button>
      </div>
    </div>
  );
};
