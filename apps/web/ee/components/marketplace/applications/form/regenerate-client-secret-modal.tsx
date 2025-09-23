"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Copy } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// ui
import { TUserApplication } from "@plane/types";
import { Button, Tooltip, TOAST_TYPE, setToast, ModalCore } from "@plane/ui";
// helpers
import { copyTextToClipboard } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import { RegenerateConfirmModal, GeneratedCredentialsModal } from "@/plane-web/components/marketplace";

type Props = {
  application: Partial<TUserApplication>;
  isOpen: boolean;
  handleClose: () => void;
};

export const RegenerateClientSecretModal: React.FC<Props> = observer((props) => {
  const { application, isOpen, handleClose } = props;

  // hooks
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  // state
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [regeneratedCredentials, setRegeneratedCredentials] = useState<{
    clientId: string;
    clientSecret: string;
  } | null>(null);

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
    setRegeneratedCredentials({
      clientId: data.client_id || "",
      clientSecret: data.client_secret || "",
    });
    setIsCredentialsModalOpen(true);
  };

  const handleCredentialsModalClose = () => {
    setIsCredentialsModalOpen(false);
    setRegeneratedCredentials(null);
  };

  return (
    <>
      <ModalCore isOpen={isOpen} handleClose={handleClose}>
        <div className="w-full p-5">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-custom-text-100">
                {t("workspace_settings.settings.applications.client_id_and_secret")}
              </h3>
              <p className="text-sm text-custom-text-400 mt-1">
                {t("workspace_settings.settings.applications.regenerate_client_secret_description")}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-custom-text-100">
                  {t("workspace_settings.settings.applications.application_id")}
                </p>
                <button
                  type="button"
                  onClick={() => copyContent(application.id ?? "", "applicationId")}
                  className="flex truncate w-full items-center justify-between rounded-md border-[0.5px] border-custom-border-200 px-3 py-3 text-sm font-medium outline-none bg-custom-background-100 text-custom-text-100 hover:bg-custom-background-80 transition-colors"
                >
                  <span className="truncate pr-2 text-custom-text-100">{application.id}</span>
                  <Tooltip tooltipContent="Copy application id" isMobile={isMobile}>
                    <Copy className="h-4 w-4 text-custom-text-400 flex-shrink-0" />
                  </Tooltip>
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-custom-text-100">
                  {t("workspace_settings.settings.applications.client_id")}
                </p>
                <button
                  type="button"
                  onClick={() => copyContent(application.client_id ?? "", "clientId")}
                  className="flex truncate w-full items-center justify-between rounded-md border-[0.5px] border-custom-border-200 px-3 py-3 text-sm font-medium outline-none bg-custom-background-100 text-custom-text-100 hover:bg-custom-background-80 transition-colors"
                >
                  <span className="truncate pr-2 text-custom-text-100">{application.client_id}</span>
                  <Tooltip tooltipContent="Copy client id" isMobile={isMobile}>
                    <Copy className="h-4 w-4 text-custom-text-400 flex-shrink-0" />
                  </Tooltip>
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-custom-text-100">
                  {t("workspace_settings.settings.applications.client_secret")}
                </p>
                <div className="flex items-center justify-between rounded-md text-sm font-medium outline-none bg-custom-background-100 text-custom-text-100 gap-2">
                  <span className="truncate pr-2 text-custom-text-100 border-[0.5px] border-custom-border-200 rounded flex-1 px-3 py-2 flex items-center">
                    {"******************"}
                  </span>
                  <div className="flex items-center space-x-2 border-[0.5px] border-custom-border-200 rounded">
                    <Button variant="neutral-primary" size="sm" onClick={() => setIsRegenerateModalOpen(true)}>
                      {t("workspace_settings.settings.applications.regenerate_client_secret")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                {t("close")}
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
      </ModalCore>

      {regeneratedCredentials && (
        <GeneratedCredentialsModal
          isOpen={isCredentialsModalOpen}
          handleClose={handleCredentialsModalClose}
          clientId={regeneratedCredentials.clientId}
          clientSecret={regeneratedCredentials.clientSecret}
          mode="update"
        />
      )}
    </>
  );
});
