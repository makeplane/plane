// components
// ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IWebhook } from "@plane/types";
// types
import { WebhookSecretKey } from "./form";

type Props = {
  handleClose: () => void;
  webhookDetails: IWebhook;
};

export function GeneratedHookDetails(props: Props) {
  const { handleClose, webhookDetails } = props;
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-5 p-5">
        <div className="space-y-3">
          <h3 className="text-18 font-medium text-secondary">{t("workspace_settings.key_created")}</h3>
          <p className="text-13 text-placeholder">{t("workspace_settings.copy_key")}</p>
        </div>
        <WebhookSecretKey data={webhookDetails} />
      </div>
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
        <Button variant="secondary" size="lg" onClick={handleClose}>
          Close
        </Button>
      </div>
    </>
  );
}
