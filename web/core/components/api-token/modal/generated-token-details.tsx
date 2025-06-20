"use client";

import { Copy } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { IApiToken } from "@plane/types";
// ui
import { Button, Tooltip, TOAST_TYPE, setToast } from "@plane/ui";
import { renderFormattedDate, renderFormattedTime, copyTextToClipboard } from "@plane/utils";
// helpers
// types
import { usePlatformOS } from "@/hooks/use-platform-os";
// hooks

type Props = {
  handleClose: () => void;
  tokenDetails: IApiToken;
};

export const GeneratedTokenDetails: React.FC<Props> = (props) => {
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
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">{t("workspace_settings.key_created")}</h3>
        <p className="text-sm text-custom-text-400">{t("workspace_settings.copy_key")}</p>
      </div>
      <button
        type="button"
        onClick={() => copyApiToken(tokenDetails.token ?? "")}
        className="mt-4 flex truncate w-full items-center justify-between rounded-md border-[0.5px] border-custom-border-200 px-3 py-2 text-sm font-medium outline-none"
      >
        <span className="truncate pr-2">{tokenDetails.token}</span>
        <Tooltip tooltipContent="Copy secret key" isMobile={isMobile}>
          <Copy className="h-4 w-4 text-custom-text-400 flex-shrink-0" />
        </Tooltip>
      </button>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-custom-text-400">
          {tokenDetails.expired_at
            ? `Expires ${renderFormattedDate(tokenDetails.expired_at!)} at ${renderFormattedTime(tokenDetails.expired_at!)}`
            : "Never expires"}
        </p>
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          {t("close")}
        </Button>
      </div>
    </div>
  );
};
