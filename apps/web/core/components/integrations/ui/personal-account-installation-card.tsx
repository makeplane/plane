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
import { Unplug } from "lucide-react";
// ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { ChevronDownIcon, ChevronRightIcon } from "@plane/propel/icons";
import { CustomMenu, Loader } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";

type TPersonalAccountInstallationCardProps = {
  providerName: string;
  isConnectionLoading: boolean;
  isUserConnected: boolean;
  handleConnection: () => Promise<void>;
};

export const PersonalAccountInstallationCard = observer(function PersonalAccountInstallationCard(
  props: TPersonalAccountInstallationCardProps
) {
  const { providerName, isConnectionLoading, isUserConnected, handleConnection } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleConnectDisconnect = async () => {
    setIsLoading(true);
    await handleConnection();
    setIsLoading(false);
  };

  return (
    <div className="shrink-0 relative flex items-center gap-4 p-2">
      <div className="w-full h-full overflow-hidden">
        <div className="text-body-xs-medium">{t("slack_integration.connect_personal_account")}</div>
        <div className="text-body-xs-regular text-secondary">
          {isUserConnected
            ? t("slack_integration.personal_account_connected", { providerName })
            : t("slack_integration.link_personal_account", { providerName })}
        </div>
      </div>
      <div className="shrink-0 relative flex items-center">
        {isUserConnected ? (
          <CustomMenu
            placement="bottom"
            closeOnSelect
            customButton={
              <Button variant="ghost" loading={isLoading}>
                {isLoading ? t("common.disconnecting") : t("common.connected")}
                <ChevronDownIcon height={12} width={12} />
              </Button>
            }
          >
            <CustomMenu.MenuItem
              key={t("common.disconnect")}
              onClick={() => {
                handleConnectDisconnect();
              }}
              className={cn("flex items-center gap-2")}
            >
              <Unplug className="size-3" />
              {t("integrations.disconnect_personal_account", { providerName })}
            </CustomMenu.MenuItem>
          </CustomMenu>
        ) : isConnectionLoading ? (
          <Loader className="flex items-center justify-center">
            <Loader.Item width="100px" height="28px" />
          </Loader>
        ) : (
          <Button variant="ghost" onClick={handleConnectDisconnect} loading={isLoading}>
            {isLoading ? t("common.connecting") : t("common.connect")}
            <ChevronRightIcon height={12} width={12} />
          </Button>
        )}
      </div>
    </div>
  );
});
