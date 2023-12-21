import { useState } from "react";
import Image from "next/image";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CreateWebhookModal } from "./create-webhook-modal";
// ui
import { Button } from "@plane/ui";
// assets
import EmptyWebhook from "public/empty-state/web-hook.svg";

export const WebhooksEmptyState = observer(() => {
  // states
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  // mobx store
  const {
    webhook: { createWebhook, clearSecretKey },
    workspace: { currentWorkspace },
  } = useMobxStore();

  return (
    <>
      <CreateWebhookModal
        createWebhook={createWebhook}
        clearSecretKey={clearSecretKey}
        currentWorkspace={currentWorkspace}
        isOpen={showCreateWebhookModal}
        onClose={() => {
          setShowCreateWebhookModal(false);
        }}
      />
      <div
        className={`mx-auto flex w-full items-center justify-center rounded-sm border border-custom-border-200 bg-custom-background-90 px-16 py-10 lg:w-3/4`}
      >
        <div className="flex w-full flex-col items-center text-center">
          <Image src={EmptyWebhook} className="w-52 sm:w-60" alt="empty" />
          <h6 className="mb-3 mt-6 text-xl font-semibold sm:mt-8">No webhooks</h6>
          <p className="mb-7 text-custom-text-300 sm:mb-8">
            Create webhooks to receive real-time updates and automate actions
          </p>
          <Button className="flex items-center gap-1.5" onClick={() => setShowCreateWebhookModal(true)}>
            Add webhook
          </Button>
        </div>
      </div>
    </>
  );
});
