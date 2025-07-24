"use client";

// components
// ui
import { useTranslation } from "@plane/i18n";
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
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-5 p-5">
        <div className="space-y-3">
          <h3 className="text-xl font-medium text-custom-text-200">{t("workspace_settings.key_created")}</h3>
          <p className="text-sm text-custom-text-400">{t("workspace_settings.copy_key")}</p>
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
