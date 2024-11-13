"use client";

import { useState, FC } from "react";
import range from "lodash/range";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { IWebhook } from "@plane/types";
// ui
import { Button, Tooltip, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { csvDownload } from "@/helpers/download.helper";
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useWebhook, useWorkspace } from "@/hooks/store";
// types
import { usePlatformOS } from "@/hooks/use-platform-os";
// utils
import { getCurrentHookAsCSV } from "../utils";
// hooks

type Props = {
  data: Partial<IWebhook>;
};

export const WebhookSecretKey: FC<Props> = observer((props) => {
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
  const handleCopySecretKey = () => {
    if (!webhookSecretKey) return;

    copyTextToClipboard(webhookSecretKey)
      .then(() =>
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Secret key copied to clipboard.",
        })
      )
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Error occurred while copying secret key.",
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
          title: "Success!",
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
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        })
      )
      .finally(() => setIsRegenerating(false));
  };

  const toggleShowKey = () => setShouldShowKey((prevState) => !prevState);

  const SECRET_KEY_OPTIONS = [
    { label: "View secret key", Icon: shouldShowKey ? EyeOff : Eye, onClick: toggleShowKey, key: "eye" },
    { label: "Copy secret key", Icon: Copy, onClick: handleCopySecretKey, key: "copy" },
  ];

  return (
    <>
      {(data || webhookSecretKey) && (
        <div className="space-y-2">
          {webhookId && <div className="text-sm font-medium">Secret key</div>}
          <div className="text-xs text-custom-text-400">Generate a token to sign-in to the webhook payload</div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex flex-grow max-w-lg items-center justify-between self-stretch rounded border border-custom-border-200 px-2 h-8">
              <div className="select-none overflow-hidden font-medium">
                {shouldShowKey ? (
                  <p className="text-xs">{webhookSecretKey}</p>
                ) : (
                  <div className="flex items-center gap-1.5 overflow-hidden mr-2">
                    {range(30).map((index) => (
                      <div key={index} className="h-1 w-1 rounded-full bg-custom-text-400 flex-shrink-0" />
                    ))}
                  </div>
                )}
              </div>
              {webhookSecretKey && (
                <div className="flex items-center gap-2">
                  {SECRET_KEY_OPTIONS.map((option) => (
                    <Tooltip key={option.key} tooltipContent={option.label} isMobile={isMobile}>
                      <button type="button" className="grid flex-shrink-0 place-items-center" onClick={option.onClick}>
                        <option.Icon className="h-3 w-3 text-custom-text-400" />
                      </button>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
            {data && (
              <div>
                <Button onClick={handleRegenerateSecretKey} variant="accent-primary" loading={isRegenerating}>
                  <RefreshCw className="h-3 w-3" />
                  {isRegenerating ? "Re-generating..." : "Re-generate key"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});
