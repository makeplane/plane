"use client"

import { useState } from "react";
import { observer } from "mobx-react";
import { Copy } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// ui
import { TUserApplication } from "@plane/types";
import { Button, Tooltip, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import { RegenerateConfirmModal } from "@/plane-web/components/marketplace";

type Props = {
  application: Partial<TUserApplication>;
  handleRegenerateSuccess: (data: Partial<TUserApplication>) => void;
};

export const RegenerateClientSecret: React.FC<Props> = observer((props) => {
  const { application, handleRegenerateSuccess } = props;

  // hooks
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  // state
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);

  const copyContent = (value: string, label: string) => {
    copyTextToClipboard(value).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: `${t("success")}!`,
        message: t(`workspace_settings.settings.applications.${label}_copied`),
      })
    );
  };

  const handleRegenerateModalClose = () => {
    setIsRegenerateModalOpen(false);
  };

  const handleRegenerated = (data: Partial<TUserApplication>) => {
    setIsRegenerateModalOpen(false);
    handleRegenerateSuccess(data);
  };


  return (
    <div className={`mt-4 space-y-2 flex flex-col rounded-md p-4 bg-custom-background-100`}>
      <div className="font-medium">{t("workspace_settings.settings.applications.client_id_and_secret")}</div>
      <div className="text-sm text-custom-text-400">{t("workspace_settings.settings.applications.regenerate_client_secret_description")}</div>
      <div className="space-y-1">
        <p className={`text-sm text-custom-text-100`}>{t("workspace_settings.settings.applications.application_id")}</p>
        <button
          type="button"
          onClick={() => copyContent(application.id ?? "", "applicationId")}
          className={`mt-4 flex truncate w-full items-center justify-between rounded-md border-[0.5px] border-custom-border-200 px-3 py-3 text-sm font-medium outline-none bg-custom-background-100 text-custom-text-100`}
        >
          <span className={`truncate pr-2 text-custom-text-100`}>{application.id}</span>
          <Tooltip tooltipContent="Copy application id" isMobile={isMobile}>
            <Copy className="h-4 w-4 text-custom-text-400 flex-shrink-0" />
          </Tooltip>
        </button>
      </div>
      <div className="space-y-1">
        <p className={`text-sm text-custom-text-100`}>{t("workspace_settings.settings.applications.client_id")}</p>
        <button
          type="button"
          onClick={() => copyContent(application.client_id ?? "", "clientId")}
          className={`mt-4 flex truncate w-full items-center justify-between rounded-md border-[0.5px] border-custom-border-200 px-3 py-3 text-sm font-medium outline-none bg-custom-background-100 text-custom-text-100`}
        >
          <span className={`truncate pr-2 text-custom-text-100`}>{application.client_id}</span>
          <Tooltip tooltipContent="Copy client id" isMobile={isMobile}>
            <Copy className="h-4 w-4 text-custom-text-400 flex-shrink-0" />
          </Tooltip>
        </button>
      </div>
      <div className="space-y-1">
        <p className={`text-sm text-custom-text-100`}>{t("workspace_settings.settings.applications.client_secret")}</p>
        <div className={`flex items-center justify-between mt-4 flex truncate w-full items-center justify-between rounded-md border-[0.5px] border-custom-border-200 px-3 py-2 text-sm font-medium outline-none bg-custom-background-100 text-custom-text-100`}>
          <span className={`truncate pr-2 text-custom-text-100`}>{"******************"}</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRegenerateModalOpen(true)}
            >
              {t("workspace_settings.settings.applications.regenerate_client_secret")}
            </Button>
          </div>
        </div>
      </div>
      <RegenerateConfirmModal
        isOpen={isRegenerateModalOpen}
        handleRegenerated={handleRegenerated}
        handleClose={handleRegenerateModalClose}
        applicationId={application.id ?? ""}
      />
    </div>
  );
});
