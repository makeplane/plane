/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TUserApplication } from "@plane/types";
import { ModalCore } from "@plane/ui";
import { useApplications } from "@/plane-web/hooks/store";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  applicationId: string;
  handleRegenerated: (data: TUserApplication) => void;
};

export const RegenerateConfirmModal = observer(function RegenerateConfirmModal(props: Props) {
  const { isOpen, handleClose, applicationId, handleRegenerated } = props;

  const { regenerateApplicationSecret } = useApplications();
  const { t } = useTranslation();

  const handleRegenerate = async () => {
    const data = await regenerateApplicationSecret(applicationId);
    if (data) {
      handleRegenerated(data);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-placeholder" />
          <div className="text-16 font-medium">
            {t("workspace_settings.settings.applications.regenerate_client_secret_confirm_title")}
          </div>
        </div>
        <div className="text-13 text-placeholder">
          {t("workspace_settings.settings.applications.regenerate_client_secret_confirm_description")}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            {t("workspace_settings.settings.applications.regenerate_client_secret_confirm_cancel")}
          </Button>
          <Button variant="error-fill" onClick={handleRegenerate}>
            {t("workspace_settings.settings.applications.regenerate_client_secret_confirm_regenerate")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
