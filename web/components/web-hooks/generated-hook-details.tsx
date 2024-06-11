"use client";

// components
// ui
import { IWebhook } from "@plane/types";
import { Button } from "@plane/ui";
// types
import { WebhookSecretKey } from "./form";

type Props = {
  handleClose: () => void;
  webhookDetails: IWebhook;
};

export const GeneratedHookDetails: React.FC<Props> = (props) => {
  const { handleClose, webhookDetails } = props;

  return (
    <>
      <div className="space-y-5 p-5">
        <div className="space-y-3">
          <h3 className="text-xl font-medium text-custom-text-200">Key created</h3>
          <p className="text-sm text-custom-text-400">
            Copy and save this secret key in Plane Pages. You can{"'"}t see this key after you hit Close. A CSV file
            containing the key has been downloaded.
          </p>
        </div>
        <WebhookSecretKey data={webhookDetails} />
      </div>
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          Close
        </Button>
      </div>
    </>
  );
};
