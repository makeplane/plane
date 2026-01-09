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
    <div className="bg-layer-2 border border-subtle px-4 py-3 rounded-lg">
      <Link
        href={`/${workspaceSlug}/settings/webhooks/${webhook?.id}`}
        className="flex items-center justify-between gap-4"
      >
        <h5 className="text-body-sm-medium truncate">{webhook.url}</h5>
        <div className="shrink-0">
          <ToggleSwitch value={webhook.is_active} onChange={handleToggle} />
        </div>
      </Link>
    </div>
  );
}
