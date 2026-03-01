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
import type { TSentryConfig, TSentryConnectionData } from "@plane/etl/sentry";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { ChevronDownIcon } from "@plane/propel/icons";
import type { TWorkspaceConnection } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// helpers
import { cn, renderFormattedDate } from "@plane/utils";

type TConnectedAppCardProps = {
  data: TWorkspaceConnection<TSentryConfig, TSentryConnectionData>;
  handleDisconnect: (connectionId: string) => Promise<void>;
};

export const ConnectedAppCard = observer(function ConnectedAppCard(props: TConnectedAppCardProps) {
  const { data, handleDisconnect } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleDisconnectApp = async () => {
    setIsLoading(true);
    await handleDisconnect(data.connection_id);
    setIsLoading(false);
  };

  return (
    <div className="flex-shrink-0 relative flex items-center gap-4 p-4 border border-subtle rounded-lg">
      <div className="w-full h-full overflow-hidden">
        <div className="text-body-xs-medium">{data.connection_slug ?? ""}</div>
        <div className="text-body-xs-regular text-secondary">
          {" "}
          {t("sentry_integration.connected_on", { date: renderFormattedDate(data.created_at) })}
        </div>
      </div>
      <div className="flex-shrink-0 relative flex items-center">
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
              handleDisconnectApp();
            }}
            className={cn("flex items-center gap-2")}
          >
            <Unplug className="size-3" />
            {t("sentry_integration.disconnect_workspace", { name: data.connection_slug ?? "" })}
          </CustomMenu.MenuItem>
        </CustomMenu>
      </div>
    </div>
  );
});
