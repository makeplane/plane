import { Copy } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, Tooltip } from "@plane/ui";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IApiToken } from "types/api_token";

type Props = {
  handleClose: () => void;
  tokenDetails: IApiToken;
};

export const GeneratedTokenDetails: React.FC<Props> = (props) => {
  const { handleClose, tokenDetails } = props;

  const { setToastAlert } = useToast();

  const copyApiToken = (token: string) => {
    copyTextToClipboard(token).then(() =>
      setToastAlert({
        type: "success",
        title: "Success!",
        message: "Token copied to clipboard.",
      })
    );
  };

  return (
    <div>
      <div className="space-y-3">
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">Key created</h3>
        <p className="text-sm text-custom-text-400">
          Copy and save this secret key in Plane Pages. You can{"'"}t see this key after you hit Close. A CSV file
          containing the key has been downloaded.
        </p>
      </div>
      <button
        type="button"
        onClick={() => copyApiToken(tokenDetails.token ?? "")}
        className="mt-4 w-full border-[0.5px] border-custom-border-200 py-2 px-3 flex items-center justify-between font-medium rounded-md text-sm outline-none"
      >
        {tokenDetails.token}
        <Tooltip tooltipContent="Copy secret key">
          <Copy className="h-4 w-4 text-custom-text-400" />
        </Tooltip>
      </button>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-custom-text-400 text-xs">
          {tokenDetails.expired_at ? `Expires ${renderFormattedDate(tokenDetails.expired_at)}` : "Never expires"}
        </p>
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          Close
        </Button>
      </div>
    </div>
  );
};
