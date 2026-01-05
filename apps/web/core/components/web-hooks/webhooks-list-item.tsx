import Link from "next/link";
import { useParams } from "next/navigation";
// Plane imports
import type { IWebhook } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
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
