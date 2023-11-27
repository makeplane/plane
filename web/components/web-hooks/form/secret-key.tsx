import { useState, FC } from "react";
import { useRouter } from "next/router";
import { Button, Tooltip } from "@plane/ui";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { observer } from "mobx-react-lite";
// hooks
import useToast from "hooks/use-toast";
// store
import { useMobxStore } from "lib/mobx/store-provider";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
import { csvDownload } from "helpers/download.helper";
// utils
import { getCurrentHookAsCSV } from "../utils";
// types
import { IWebhook } from "types";

type Props = {
  data: Partial<IWebhook>;
};

export const WebhookSecretKey: FC<Props> = observer((props) => {
  const { data } = props;
  // states
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [shouldShowKey, setShouldShowKey] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, webhookId } = router.query;
  // store
  const {
    webhook: { currentWebhook, regenerateSecretKey, webhookSecretKey },
    workspace: { currentWorkspace },
  } = useMobxStore();
  // hooks
  const { setToastAlert } = useToast();

  const handleCopySecretKey = () => {
    if (!webhookSecretKey) return;

    copyTextToClipboard(webhookSecretKey)
      .then(() =>
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Secret key copied to clipboard.",
        })
      )
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Error occurred while copying secret key.",
        })
      );
  };

  const handleRegenerateSecretKey = () => {
    if (!workspaceSlug || !webhookId) return;

    setIsRegenerating(true);

    regenerateSecretKey(workspaceSlug.toString(), webhookId.toString())
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "New key regenerated successfully.",
        });

        const csvData = getCurrentHookAsCSV(currentWorkspace, currentWebhook, webhookSecretKey);
        csvDownload(csvData, `webhook-secret-key-${Date.now()}`);
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
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
          <div className="text-sm font-medium">Secret key</div>
          <div className="text-xs text-custom-text-400">Generate a token to sign-in to the webhook payload</div>
          <div className="flex items-center gap-4">
            <div className="self-stretch flex items-center justify-between py-1.5 px-2 rounded min-w-[30rem] max-w-lg border border-custom-border-200">
              <div className="overflow-hidden font-medium select-none">
                {shouldShowKey ? (
                  <p className="text-xs">{webhookSecretKey}</p>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {[...Array(30)].map((_, index) => (
                      <div key={index} className="w-1 h-1 bg-custom-text-400 rounded-full" />
                    ))}
                  </div>
                )}
              </div>
              {webhookSecretKey && (
                <div className="flex items-center gap-2">
                  {SECRET_KEY_OPTIONS.map((option) => (
                    <Tooltip key={option.key} tooltipContent={option.label}>
                      <button type="button" className="flex-shrink-0 grid place-items-center" onClick={option.onClick}>
                        <option.Icon className="text-custom-text-400 h-3 w-3" />
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
