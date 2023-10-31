import { useState, FC } from "react";
import { Button, Input } from "@plane/ui";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { generateRandomString } from "helpers/generate-random-string";
import { observer } from "mobx-react-lite";
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";
import { copyTextToClipboard } from "helpers/string.helper";

interface IGenerateKey {
  type: "create" | "edit";
}

export const GenerateKey: FC<IGenerateKey> = observer((props) => {
  const { type } = props;
  const { webhook: webhookStore }: RootStore = useMobxStore();

  const [generateKey, setShowGenarateKey] = useState(false);

  return (
    <>
      {type === 'edit' || (type === 'create' && webhookStore?.webhookSecretKey) && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Secret Key</div>
          <div className="text-sm text-neutral-400">Genarate a token to sign-in the webhook payload</div>

          <div className="flex gap-5">
            <div className="relative flex items-center p-2 rounded w-full border border-custom-border-200">
              <div className="w-full overflow-hidden px-2 font-medium select-none">
                {webhookStore?.webhookSecretKey ? <div>{webhookStore?.webhookSecretKey}</div> :
                  <div className="flex items-center gap-1.5">
                    {[...Array(41)].map((_, index) => <div key={index} className="w-[4px] h-[4px] bg-gray-300 rounded-full"></div>)}
                  </div>
                }
              </div>
              {webhookStore?.webhookSecretKey && (
                <div className="w-7 h-7 flex-shrink-0 flex justify-center items-center cursor-pointer hover:bg-custom-background-80 rounded" onClick={() => copyTextToClipboard(webhookStore?.webhookSecretKey || '')}>
                  <Copy className="text-custom-text-400 w-4 h-4" />
                </div>
              )}
            </div>
            <div>
              {type != 'create' && (
                <Button onClick={() => { }} className="">
                  <RefreshCw className={`h-3 w-3`} />
                  Re-genarate Key
                </Button>
              )}
            </div>
          </div>
        </div >
      )}
    </>
  );
});
