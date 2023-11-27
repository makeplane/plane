// next
import { useRouter } from "next/router";
import Image from "next/image";
// ui
import { Button } from "@plane/ui";
// assets
import EmptyWebhook from "public/empty-state/web-hook.svg";

export const WebhooksEmptyState = () => {
  const router = useRouter();

  return (
    <div
      className={`flex items-center justify-center mx-auto rounded-sm border border-custom-border-200 bg-custom-background-90 py-10 px-16 w-full`}
    >
      <div className="text-center flex flex-col items-center w-full">
        <Image src={EmptyWebhook} className="w-52 sm:w-60" alt="empty" />
        <h6 className="text-xl font-semibold mt-6 sm:mt-8 mb-3">No webhooks</h6>
        <p className="text-custom-text-300 mb-7 sm:mb-8">
          Create webhooks to receive real-time updates and automate actions
        </p>
        <Button className="flex items-center gap-1.5" onClick={() => router.push(`${router.asPath}/create/`)}>
          Add webhook
        </Button>
      </div>
    </div>
  );
};
