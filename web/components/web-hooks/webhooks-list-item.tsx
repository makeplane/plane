import { FC, useState } from "react";
import { ToggleSwitch } from "@plane/ui";
import { Pencil, XCircle } from "lucide-react";
import { IWebhook } from "types";
import Link from "next/link";

interface IWebhookListItem {
  workspaceSlug: string;
  webhook: IWebhook
}

export const WebhooksListItem: FC<IWebhookListItem> = (props) => {

  const { workspaceSlug, webhook } = props

  const [toggle, setToggle] = useState(false);

  return (
    <div>
      <Link href={`/${workspaceSlug}/settings/webhooks/${webhook?.id}`}>
        {/* <div class="flex  items-center py-3.5 border-b border-custom-border-200"></div> */}
        <div className="flex justify-between px-3.5 py-[18px]">
          <div>
            <div className="text-base font-medium">{webhook?.url || "Webhook URL"}</div>
            {/* <div className="text-base text-neutral-700">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
          </div> */}
          </div>
          {/* <div className="flex gap-4 items-center">
          <ToggleSwitch value={toggle} onChange={(value) => setToggle(!toggle)} />
        </div> */}
        </div>
      </Link>
    </div>
  );
};
