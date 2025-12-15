import React from "react";
// ui
import { Button } from "@plane/propel/button";
// assets
import EmptyWebhook from "@/app/assets/empty-state/web-hook.svg?url";

type Props = {
  onClick: () => void;
};

export function WebhooksEmptyState(props: Props) {
  const { onClick } = props;
  return (
    <div
      className={`mx-auto flex w-full items-center justify-center rounded-xs border border-subtle bg-surface-2 px-16 py-10 lg:w-3/4`}
    >
      <div className="flex w-full flex-col items-center text-center">
        <img src={EmptyWebhook} className="w-52 sm:w-60 object-cover" alt="empty" />
        <h6 className="mb-3 mt-6 text-18 font-semibold sm:mt-8">No webhooks</h6>
        <p className="mb-7 text-tertiary sm:mb-8">Create webhooks to receive real-time updates and automate actions</p>
        <Button className="flex items-center gap-1.5" onClick={onClick}>
          Add webhook
        </Button>
      </div>
    </div>
  );
}
