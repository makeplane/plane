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

import { useState } from "react";
import { observer } from "mobx-react";

import { CopyIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// ui
import type { TUserApplication } from "@plane/types";
import { Tooltip, ModalCore } from "@plane/ui";
// helpers
import { copyTextToClipboard } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import { RegenerateConfirmModal, GeneratedCredentialsModal } from "@/components/marketplace";

type Props = {
  application: Partial<TUserApplication>;
  isOpen: boolean;
  handleClose: () => void;
};

export const RegenerateClientSecretModal = observer(function RegenerateClientSecretModal(props: Props) {
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
              <h3 className="text-16 font-medium text-primary">
                {t("workspace_settings.settings.applications.client_id_and_secret")}
              </h3>
              <p className="text-13 text-placeholder mt-1">
                {t("workspace_settings.settings.applications.regenerate_client_secret_description")}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-13 text-primary">{t("workspace_settings.settings.applications.application_id")}</p>
                <button
                  type="button"
                  onClick={() => copyContent(application.id ?? "", "applicationId")}
                  className="flex truncate w-full items-center justify-between rounded-md border-[0.5px] border-subtle-1 px-3 py-3 text-13 font-medium outline-none bg-surface-1 text-primary hover:bg-layer-1 transition-colors"
                >
                  <span className="truncate pr-2 text-primary">{application.id}</span>
                  <Tooltip tooltipContent="Copy application id" isMobile={isMobile}>
                    <CopyIcon className="h-4 w-4 text-placeholder flex-shrink-0" />
                  </Tooltip>
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-13 text-primary">{t("workspace_settings.settings.applications.client_id")}</p>
                <button
                  type="button"
                  onClick={() => copyContent(application.client_id ?? "", "clientId")}
                  className="flex truncate w-full items-center justify-between rounded-md border-[0.5px] border-subtle-1 px-3 py-3 text-13 font-medium outline-none bg-surface-1 text-primary hover:bg-layer-1 transition-colors"
                >
                  <span className="truncate pr-2 text-primary">{application.client_id}</span>
                  <Tooltip tooltipContent="Copy client id" isMobile={isMobile}>
                    <CopyIcon className="h-4 w-4 text-placeholder flex-shrink-0" />
                  </Tooltip>
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-13 text-primary">{t("workspace_settings.settings.applications.client_secret")}</p>
                <div className="flex items-center justify-between rounded-md text-13 font-medium outline-none bg-surface-1 text-primary gap-2">
                  <span className="truncate pr-2 text-primary border border-subtle-1 rounded-sm flex-1 px-3 py-2 flex items-center">
                    {"******************"}
                  </span>
                  <div className="flex items-center space-x-2 rounded">
                    <Button size="xl" variant="secondary" onClick={() => setIsRegenerateModalOpen(true)}>
                      {t("workspace_settings.settings.applications.regenerate_client_secret")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="secondary" size="lg" onClick={handleClose}>
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
