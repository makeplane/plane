"use client";

import { CheckCircle, Copy } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// ui
import { Button, ModalCore, TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// helpers
import { copyTextToClipboard, csvDownload } from "@plane/utils";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  isOpen: boolean;
  clientSecret: string;
  clientId: string;
  handleClose: () => void;
};

export const GeneratedCredentialsModal: React.FC<Props> = (props) => {
  const { isOpen, clientSecret, clientId, handleClose } = props;
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  const copyContent = (value: string, label: string) => {
    copyTextToClipboard(value).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: `${t("success")}!`,
        message: t(`workspace_settings.settings.applications.${label}_copied`),
      })
    );
  };

  const downloadSecretKey = () => {
    const csvData = {
      ClientId: clientId ?? "",
      ClientSecret: clientSecret ?? "",
    };

    csvDownload(csvData, `secret-key-${Date.now()}`);
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose}>
      <div className="w-full p-5">
        <div className="flex items-center space-x-2">
          <div className="bg-green-500 rounded-full p-2">
            <CheckCircle className="h-4 w-4 text-white flex-shrink-0" />
          </div>
          <div className="space-y-1 text-wrap">
            <h3 className="text-lg font-medium leading-6 text-custom-text-100">
              {t("workspace_settings.settings.applications.app_available")}
            </h3>
            <p className="text-sm text-custom-text-400">
              {t("workspace_settings.settings.applications.app_available_description")}
            </p>
          </div>
        </div>

        <div className={`mt-4 space-y-2 flex flex-col rounded-md p-4 bg-custom-background-100`}>
          <div className="font-medium">{t("workspace_settings.settings.applications.client_id_and_secret")}</div>
          <div className="text-sm text-custom-text-400">
            {t("workspace_settings.settings.applications.client_id_and_secret_description")}
            <br />
            {t("workspace_settings.settings.applications.client_id_and_secret_download")}
          </div>
          <div className="space-y-1">
            <p className={`text-sm text-custom-text-100`}>{t("workspace_settings.settings.applications.client_id")}</p>
            <button
              type="button"
              onClick={() => copyContent(clientId, "clientId")}
              className={`mt-4 flex truncate w-full items-center justify-between rounded-md border-[0.5px] border-custom-border-200 px-3 py-3 text-sm font-medium outline-none bg-custom-background-100`}
            >
              <span className={`truncate pr-2 text-custom-text-100`}>{clientId}</span>
              <Tooltip tooltipContent="Copy client id" isMobile={isMobile}>
                <Copy className="h-4 w-4 text-custom-text-400 flex-shrink-0" />
              </Tooltip>
            </button>
          </div>
          <div className="space-y-1">
            <p className={`text-sm text-custom-text-100`}>
              {t("workspace_settings.settings.applications.client_secret")}
            </p>
            <div
              className={`flex items-center justify-between mt-4 flex truncate w-full items-center justify-between rounded-md border-[0.5px] border-custom-border-200 px-3 py-2 text-sm font-medium outline-none bg-custom-background-100`}
            >
              <span className={`truncate pr-2 text-custom-text-100`}>{clientSecret}</span>
              <div className="flex items-center space-x-2">
                <button type="button" onClick={() => copyContent(clientSecret, "clientSecret")}>
                  <Tooltip tooltipContent="Copy secret key" isMobile={isMobile}>
                    <Copy className="h-4 w-4 text-custom-text-400 flex-shrink-0" />
                  </Tooltip>
                </button>
                <button
                  type="button"
                  onClick={downloadSecretKey}
                  className={`flex truncate rounded-md border-[0.5px] border-custom-border-200 px-2 py-1 text-sm font-medium outline-none bg-custom-background-100 text-custom-text-100`}
                >
                  {t("workspace_settings.settings.applications.export_as_csv")}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
};
