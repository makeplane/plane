import { useState, FC } from "react";
import { useRouter } from "next/router";
import { Button } from "@plane/ui";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { observer } from "mobx-react-lite";
// hooks
import useToast from "hooks/use-toast";
// store
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
import { csvDownload } from "helpers/download.helper";
// utils
import { getCurrentHookAsCSV } from "../utils";
// enum
import { WebHookFormTypes } from "./index";

interface IGenerateKey {
  type: WebHookFormTypes.CREATE | WebHookFormTypes.EDIT;
}

export const GenerateKey: FC<IGenerateKey> = observer((props) => {
  const { type } = props;
  // states
  const [regenerating, setRegenerate] = useState(false);
  const [shouldShowKey, setShouldShowKey] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, webhookId } = router.query as { workspaceSlug: string; webhookId: string };
  // store
  const { webhook: webhookStore, workspace: workspaceStore }: RootStore = useMobxStore();
  // hooks
  const { setToastAlert } = useToast();

  const handleCopySecret = () => {
    if (webhookStore?.webhookSecretKey) {
      copyTextToClipboard(webhookStore.webhookSecretKey);
      setToastAlert({
        title: "Success",
        type: "success",
        message: "Secret key copied",
      });
    } else {
      setToastAlert({
        title: "Oops",
        type: "error",
        message: "Error occurred while copying secret key",
      });
    }
  };

  function handleRegenerate() {
    setRegenerate(true);
    webhookStore
      .regenerate(workspaceSlug, webhookId)
      .then(() => {
        setToastAlert({
          title: "Success",
          type: "success",
          message: "Successfully regenerated",
        });

        const csvData = getCurrentHookAsCSV(
          workspaceStore.currentWorkspace,
          webhookStore.currentWebhook,
          webhookStore.webhookSecretKey
        );
        csvDownload(csvData, `Secret-key-${Date.now()}`);
      })
      .catch((err) => {
        setToastAlert({
          title: "Oops!",
          type: "error",
          message: err?.error,
        });
      })
      .finally(() => {
        setRegenerate(false);
      });
  }

  const toggleShowKey = () => {
    setShouldShowKey((prevState) => !prevState);
  };

  const icons = [
    { Component: Copy, onClick: handleCopySecret, key: "copy" },
    { Component: shouldShowKey ? EyeOff : Eye, onClick: toggleShowKey, key: "eye" },
  ];

  return (
    <>
      {(type === WebHookFormTypes.EDIT || (type === WebHookFormTypes.CREATE && webhookStore?.webhookSecretKey)) && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Secret Key</div>
          <div className="text-sm text-neutral-400">Genarate a token to sign-in the webhook payload</div>

          <div className="flex gap-5 items-center">
            <div className="relative flex items-center p-2 rounded w-full border border-custom-border-200">
              <div className="flex w-full overflow-hidden h-7 px-2 font-medium select-none">
                {webhookStore?.webhookSecretKey && shouldShowKey ? (
                  <div>{webhookStore?.webhookSecretKey}</div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {[...Array(41)].map((_, index) => (
                      <div key={index} className="w-[4px] h-[4px] bg-gray-300 rounded-full" />
                    ))}
                  </div>
                )}
              </div>
              {webhookStore?.webhookSecretKey && (
                <>
                  {icons.map(({ Component, onClick, key }) => (
                    <div
                      className="w-7 h-7 flex-shrink-0 flex justify-center items-center cursor-pointer hover:bg-custom-background-80 rounded"
                      onClick={onClick}
                      key={key}
                    >
                      <Component className="text-custom-text-400 w-4 h-4" />
                    </div>
                  ))}
                </>
              )}
            </div>
            <div>
              {type != WebHookFormTypes.CREATE && (
                <Button disabled={regenerating} onClick={handleRegenerate} variant="accent-primary" className="">
                  <RefreshCw className={`h-3 w-3`} />
                  {regenerating ? "Re-generating..." : "Re-genarate Key"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});
