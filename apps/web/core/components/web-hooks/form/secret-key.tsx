import type { FC } from "react";
import { useState } from "react";
import { range } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CopyIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { IWebhook } from "@plane/types";
// ui
import { csvDownload, copyTextToClipboard } from "@plane/utils";
// hooks
import { useWebhook } from "@/hooks/store/use-webhook";
import { useWorkspace } from "@/hooks/store/use-workspace";
// types
import { usePlatformOS } from "@/hooks/use-platform-os";
// utils
import { getCurrentHookAsCSV } from "../utils";
// hooks

type Props = {
  data: Partial<IWebhook>;
};

export const WebhookSecretKey = observer(function WebhookSecretKey(props: Props) {
  const { data } = props;
  // states
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [shouldShowKey, setShouldShowKey] = useState(false);
  // router
  const { workspaceSlug, webhookId } = useParams();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { currentWebhook, regenerateSecretKey, webhookSecretKey } = useWebhook();
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  const handleCopySecretKey = () => {
    if (!webhookSecretKey) return;

    copyTextToClipboard(webhookSecretKey)
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: `${t("success")}`,
          message: t("workspace_settings.settings.webhooks.toasts.secret_key_copied.message"),
        })
      )
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: `${t("error")}!`,
          message: t("workspace_settings.settings.webhooks.toasts.secret_key_not_copied.message"),
        })
      );
  };

  const handleRegenerateSecretKey = () => {
    if (!workspaceSlug || !data.id) return;

    setIsRegenerating(true);

    regenerateSecretKey(workspaceSlug.toString(), data.id)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: `${t("success")}`,
          message: "New key regenerated successfully.",
        });

        if (currentWebhook && webhookSecretKey) {
          const csvData = getCurrentHookAsCSV(currentWorkspace, currentWebhook, webhookSecretKey);
          csvDownload(csvData, `webhook-secret-key-${Date.now()}`);
        }
      })
      .catch((err) =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: `${t("error")}!`,
          message: err?.error ?? t("something_went_wrong_please_try_again"),
        })
      )
      .finally(() => setIsRegenerating(false));
  };

  const toggleShowKey = () => setShouldShowKey((prevState) => !prevState);

  const SECRET_KEY_OPTIONS = [
    { label: "View secret key", Icon: shouldShowKey ? EyeOff : Eye, onClick: toggleShowKey, key: "eye" },
    { label: "Copy secret key", Icon: CopyIcon, onClick: handleCopySecretKey, key: "copy" },
  ];

  return (
    <>
      {(data || webhookSecretKey) && (
        <div className="space-y-2">
          {webhookId && (
            <div className="text-13 font-medium">{t("workspace_settings.settings.webhooks.secret_key.title")}</div>
          )}
          <div className="text-11 text-placeholder">{t("workspace_settings.settings.webhooks.secret_key.message")}</div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex flex-grow max-w-lg items-center justify-between self-stretch rounded-sm border border-subtle px-2 h-8">
              <div className="select-none overflow-hidden font-medium">
                {shouldShowKey ? (
                  <p className="text-11">{webhookSecretKey}</p>
                ) : (
                  <div className="flex items-center gap-1.5 overflow-hidden mr-2">
                    {range(30).map((index) => (
                      <div key={index} className="h-1 w-1 rounded-full bg-(--text-color-disabled) flex-shrink-0" />
                    ))}
                  </div>
                )}
              </div>
              {webhookSecretKey && (
                <div className="flex items-center gap-2">
                  {SECRET_KEY_OPTIONS.map((option) => (
                    <Tooltip key={option.key} tooltipContent={option.label} isMobile={isMobile}>
                      <button type="button" className="grid flex-shrink-0 place-items-center" onClick={option.onClick}>
                        <option.Icon className="h-3 w-3 text-placeholder" />
                      </button>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
            {data && (
              <div>
                <Button
                  onClick={handleRegenerateSecretKey}
                  variant="secondary"
                  size="lg"
                  loading={isRegenerating}
                  prependIcon={<RefreshCw />}
                >
                  {isRegenerating ? `${t("re_generating")}...` : t("re_generate_key")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});
