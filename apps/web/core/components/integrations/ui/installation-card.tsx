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
// ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Loader } from "@plane/ui";

type TInstallationCardProps = {
  providerName: string;
  providerDescription: string;
  providerLogo: string;
  isConnectionLoading: boolean;
  isAppConnected: boolean;
  handleInstallation: () => Promise<void>;
};

export const InstallationCard = observer(function InstallationCard(props: TInstallationCardProps) {
  const { providerName, providerDescription, providerLogo, isConnectionLoading, isAppConnected, handleInstallation } =
    props;
  // states
  const [isAppInstalling, setIsAppInstalling] = useState(false);
  const { t } = useTranslation();

  const handleInstall = async () => {
    setIsAppInstalling(true);
    await handleInstallation();
    setIsAppInstalling(false);
  };

  return (
    <div className="flex-shrink-0 relative flex items-center gap-4 p-4 bg-layer-1 rounded-lg">
      <div className="flex-shrink-0 size-10 relative flex justify-center items-center overflow-hidden">
        <img src={providerLogo} alt={`${providerName} Logo`} className="w-full h-full object-cover" />
      </div>
      <div className="w-full h-full overflow-hidden">
        <div className="text-body-sm-medium">{providerName}</div>
        <div className="text-body-xs-regular text-secondary">{providerDescription}</div>
      </div>
      <div className="flex-shrink-0 relative flex items-center gap-4">
        {isAppConnected ? (
          <div className="text-body-xs-regular bg-success-subtle text-success-primary px-3 py-1 rounded-md">
            {t("common.connected")}
          </div>
        ) : isConnectionLoading ? (
          <Loader className="flex items-center justify-center">
            <Loader.Item width="70px" height="30px" />
          </Loader>
        ) : (
          <Button onClick={handleInstall} loading={isAppInstalling}>
            {isAppInstalling ? t("common.installing") : t("common.install")}
          </Button>
        )}
      </div>
    </div>
  );
});
