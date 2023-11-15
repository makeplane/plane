import { FC } from "react";
import Link from "next/link";
import { Button } from "@plane/ui";
import Image from "next/image";
import EmptyWebhookLogo from "public/empty-state/issue.svg";

interface IWebHookLists {
  workspaceSlug: string;
}

export const EmptyWebhooks: FC<IWebHookLists> = (props) => {
  const { workspaceSlug } = props;

  return (
    <div className="flex items-start justify-center">
      <div className="flex p-10 flex-col items-center justify-center rounded-[4px] border border-custom-border-200 bg-custom-color-background-90">
        <Image width="178" height="116" src={EmptyWebhookLogo} alt="empty-webhook image" />

        <div className="mt-4 text-base font-semibold">No Webhooks</div>
        <p className="text-sm text-neutral-600">Create webhooks to receive real-time updates and automate actions</p>
        <Link href={`/${workspaceSlug}/settings/webhooks/create`}>
          <Button variant="primary" className="mt-2">
            Add Webhook
          </Button>
        </Link>
      </div>
    </div>
  );
};
