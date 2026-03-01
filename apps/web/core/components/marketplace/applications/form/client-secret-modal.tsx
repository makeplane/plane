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

import { CheckCircle } from "lucide-react";
import { CopyIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { ModalCore } from "@plane/ui";
import { copyTextToClipboard, csvDownload } from "@plane/utils";
// helpers
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  isOpen: boolean;
  clientSecret: string;
  clientId: string;
  handleClose: () => void;
  mode?: "create" | "update";
};

export function GeneratedCredentialsModal(props: Props) {
  const { isOpen, clientSecret, clientId, handleClose, mode = "create" } = props;
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
          <div className="bg-success-primary rounded-full p-2">
            <CheckCircle className="h-4 w-4 text-on-color flex-shrink-0" />
          </div>
          <div className="space-y-1 text-wrap">
            <h3 className="text-16 font-medium leading-6 text-primary">
              {t(
                `workspace_settings.settings.applications.${mode === "create" ? "app_created" : "app_credentials_regenrated"}.title`
              )}
            </h3>
            <p className="text-13 text-placeholder">
              {t(
                `workspace_settings.settings.applications.${mode === "create" ? "app_created" : "app_credentials_regenrated"}.description`
              )}
            </p>
          </div>
        </div>

        <div className={`mt-4 space-y-2 flex flex-col rounded-md p-4 bg-surface-1`}>
          <div className="font-medium">{t("workspace_settings.settings.applications.client_id_and_secret")}</div>
          <div className="text-13 text-placeholder">
            {t("workspace_settings.settings.applications.client_id_and_secret_description")}
            <br />
            {t("workspace_settings.settings.applications.client_id_and_secret_download")}
          </div>
          <div className="space-y-1">
            <p className={`text-13 text-primary`}>{t("workspace_settings.settings.applications.client_id")}</p>
            <button
              type="button"
              onClick={() => copyContent(clientId, "clientId")}
              className={`mt-4 flex truncate w-full items-center justify-between rounded-md border-[0.5px] border-subtle-1 px-3 py-3 text-13 font-medium outline-none bg-surface-1`}
            >
              <span className={`truncate pr-2 text-primary`}>{clientId}</span>
              <Tooltip tooltipContent="Copy client id" isMobile={isMobile}>
                <CopyIcon className="h-4 w-4 text-placeholder flex-shrink-0" />
              </Tooltip>
            </button>
          </div>
          <div className="space-y-1">
            <p className={`text-13 text-primary`}>{t("workspace_settings.settings.applications.client_secret")}</p>
            <div
              className={`flex items-center justify-between mt-4  truncate w-full rounded-md border-[0.5px] border-subtle-1 px-3 py-2 text-13 font-medium outline-none bg-surface-1`}
            >
              <span className={`truncate pr-2 text-primary`}>{clientSecret}</span>
              <div className="flex items-center space-x-2">
                <button type="button" onClick={() => copyContent(clientSecret, "clientSecret")}>
                  <Tooltip tooltipContent="Copy secret key" isMobile={isMobile}>
                    <CopyIcon className="h-4 w-4 text-placeholder flex-shrink-0" />
                  </Tooltip>
                </button>
                <button
                  type="button"
                  onClick={downloadSecretKey}
                  className={`flex truncate rounded-md border-[0.5px] border-subtle-1 px-2 py-1 text-13 font-medium outline-none bg-surface-1 text-primary`}
                >
                  {t("workspace_settings.settings.applications.export_as_csv")}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end">
          <Button variant="secondary" onClick={handleClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
