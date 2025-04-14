"use client";

import { observer } from "mobx-react";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TUserApplication } from "@plane/types";
import { Button, ModalCore } from "@plane/ui";
import { useApplications } from "@/plane-web/hooks/store";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  applicationId: string;
  handleRegenerated: (data: TUserApplication) => void;
};

export const RegenerateConfirmModal: React.FC<Props> = observer((props) => {
  const { isOpen, handleClose, applicationId, handleRegenerated } = props;

  const { regenerateApplicationSecret } = useApplications();
  const { t } = useTranslation();

  const handleRegenerate = async () => {
    const data = await regenerateApplicationSecret(applicationId);
    if (data) {
      handleRegenerated(data);
    }
  };

  return (<ModalCore isOpen={isOpen} handleClose={handleClose}>
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-6 w-6 text-custom-text-400" />
        <div className="text-lg font-medium">{t("workspace_settings.settings.applications.regenerate_client_secret_confirm_title")}</div>
      </div>
      <div className="text-sm text-custom-text-400">{t("workspace_settings.settings.applications.regenerate_client_secret_confirm_description")}</div>
      <div className="flex justify-end gap-2">
        <Button variant="link-neutral" onClick={handleClose}>{t("workspace_settings.settings.applications.regenerate_client_secret_confirm_cancel")}</Button>
        <Button variant="danger" onClick={handleRegenerate}>{t("workspace_settings.settings.applications.regenerate_client_secret_confirm_regenerate")}</Button>
      </div>
    </div>
  </ModalCore>
  );
});