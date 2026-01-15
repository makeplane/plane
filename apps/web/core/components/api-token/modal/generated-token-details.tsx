import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CopyIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { IApiToken } from "@plane/types";
// ui
import { renderFormattedDate, renderFormattedTime, copyTextToClipboard } from "@plane/utils";
// helpers
// types
import { usePlatformOS } from "@/hooks/use-platform-os";
// hooks

type Props = {
  handleClose: () => void;
  tokenDetails: IApiToken;
};

export function GeneratedTokenDetails(props: Props) {
  const { handleClose, tokenDetails } = props;
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  const copyApiToken = (token: string) => {
    copyTextToClipboard(token).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: `${t("success")}!`,
        message: t("workspace_settings.token_copied"),
      })
    );
  };

  return (
    <div className="w-full p-5">
      <div className="w-full space-y-3 text-wrap">
        <h3 className="text-16 font-medium leading-6 text-primary">{t("workspace_settings.key_created")}</h3>
        <p className="text-13 text-placeholder">{t("workspace_settings.copy_key")}</p>
      </div>
      <button
        type="button"
        onClick={() => copyApiToken(tokenDetails.token ?? "")}
        className="mt-4 flex truncate w-full items-center justify-between rounded-md border-[0.5px] border-subtle px-3 py-2 text-13 font-medium outline-none"
      >
        <span className="truncate pr-2">{tokenDetails.token}</span>
        <Tooltip tooltipContent="Copy secret key" isMobile={isMobile}>
          <CopyIcon className="h-4 w-4 text-placeholder flex-shrink-0" />
        </Tooltip>
      </button>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-11 text-placeholder">
          {tokenDetails.expired_at
            ? `Expires ${renderFormattedDate(tokenDetails.expired_at)} at ${renderFormattedTime(tokenDetails.expired_at)}`
            : "Never expires"}
        </p>
        <Button variant="secondary" onClick={handleClose}>
          {t("close")}
        </Button>
      </div>
    </div>
  );
}
