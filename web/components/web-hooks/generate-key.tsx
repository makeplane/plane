import { useState, FC } from "react";
import { Button, Input } from "@plane/ui";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { generateRandomString } from "helpers/generate-random-string";
import { observer } from "mobx-react-lite";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";
import { copyTextToClipboard, copyUrlToClipboard } from "helpers/string.helper";
import { useRouter } from "next/router";
import useToast from "hooks/use-toast";
import { csvDownload } from "helpers/download.helper";
import { stringify } from "querystring";
import { renderDateFormat } from "helpers/date-time.helper";

interface IGenerateKey {
  type: "create" | "edit";
}

export const GenerateKey: FC<IGenerateKey> = observer((props) => {
  const { type } = props;
  const [regenerating, setRegenerate] = useState(false);
  const router = useRouter();
  const { workspaceSlug, webhookId } = router.query as { workspaceSlug: string, webhookId: string };
  const { webhook: webhookStore, workspace: workspaceStore }: RootStore = useMobxStore();
  const { setToastAlert } = useToast();
  // const [showgenerateKey, setShowGenarateKey] = useState(false);

  function handleRegenerate() {
      setRegenerate(true);
      webhookStore.regenerate(workspaceSlug, webhookId).then(
        () => {
          // setShowGenarateKey(true);
          setToastAlert({
            title: "Success",
            type: "success",
            message: "Successfully regenerated",
          });
          csvDownload([[
            "id",
            "url",
            "created_at",
            "updated_at",
            "is_active",
            "secret_key",
            "project",
            "issue",
            "module",
            "cycle",
            "issue_comment",
            "workspace"
          ], [
            webhookStore.currentWebhook?.id!,
            webhookStore.currentWebhook?.url!,
            renderDateFormat(webhookStore.currentWebhook?.created_at!),
            renderDateFormat(webhookStore.currentWebhook?.updated_at!),
            String(webhookStore.currentWebhook?.is_active!),
            webhookStore.currentWebhook?.secret_key!,
            String(webhookStore.currentWebhook?.project!),
            String(webhookStore.currentWebhook?.issue!),
            String(webhookStore.currentWebhook?.module!),
            String(webhookStore.currentWebhook?.cycle!),
            String(webhookStore.currentWebhook?.issue_comment!),
            workspaceStore.currentWorkspace?.name!,
          ]
        ], "Secret-key")
        }
      ).catch((err)=>{
        setToastAlert({
          title: "Oops!",
          type: "error",
          message: err?.error,
        });
      }).finally(()=>{
        setRegenerate(false);
      })
  }
  console.log(webhookStore?.webhookSecretKey);
  return (
    <>
      {(type === 'edit' || (type === 'create' && webhookStore?.webhookSecretKey)) && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Secret Key</div>
          <div className="text-sm text-neutral-400">Genarate a token to sign-in the webhook payload</div>

          <div className="flex gap-5">
            <div className="relative flex items-center p-2 rounded w-full border border-custom-border-200">
              <div className="w-full overflow-hidden px-2 font-medium select-none">
                {(webhookStore?.webhookSecretKey) ? <div>{webhookStore?.webhookSecretKey}</div> :
                  <div className="flex items-center gap-1.5">
                    {[...Array(41)].map((_, index) => <div key={index} className="w-[4px] h-[4px] bg-gray-300 rounded-full"></div>)}
                  </div>
                }
              </div>
              {webhookStore?.webhookSecretKey && (
                <div className="w-7 h-7 flex-shrink-0 flex justify-center items-center cursor-pointer hover:bg-custom-background-80 rounded" onClick={() => copyTextToClipboard(webhookStore?.webhookSecretKey || '')}>
                  <Copy onClick={() => { 
                    navigator.clipboard.writeText(webhookStore.webhookSecretKey!);
                    setToastAlert({
                      title: "Success",
                      type: "success",
                      message: "Secret key copied",
                    });
                   }} className="text-custom-text-400 w-4 h-4" />
                </div>
              )}
            </div>
            <div>
              {type != 'create' && (
                <Button disabled={regenerating} onClick={
                  handleRegenerate
                } className="">
                  <RefreshCw className={`h-3 w-3`} />
                  {regenerating ? "Re-generating..." :  "Re-genarate Key"}
                </Button>
              )}
            </div>
          </div>
        </div >
      )}
    </>
  );
});
