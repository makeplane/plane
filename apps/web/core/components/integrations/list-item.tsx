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

import type { FC } from "react";
import Link from "next/link";
import { InfoIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
// plane web components
import type { IntegrationProps } from "@/components/integrations";
// plane web hooks
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { BetaBadge } from "@/components/common/beta";

export type IntegrationListItemProps = {
  provider: IntegrationProps;
  workspaceSlug: string;
  isSupported: boolean;
};

export function IntegrationListItem(props: IntegrationListItemProps) {
  const { provider, workspaceSlug, isSupported } = props;
  const isEnabled = useFlag(workspaceSlug, provider.flag);
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();

  const { t } = useTranslation();

  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;

  if (!isEnabled) return null;

  return (
    <div
      key={provider.key}
      className="flex flex-col max-w-[300px] justify-between gap-2 rounded-md border border-subtle bg-surface-1  px-4 py-6 flex-shrink-0"
    >
      <div className="relative h-12 w-12 flex-shrink-0 bg-layer-1 rounded-sm flex items-center justify-center">
        <img src={provider.logo} alt={`${provider.key} Logo`} className="w-full h-full object-cover" />
      </div>

      <div className="relative flex items-center gap-2">
        <h3 className="flex items-center gap-4 text-body-xs-medium">{t(`${provider.key}_integration.name`)}</h3>
        {provider.beta && <BetaBadge />}
      </div>
      <p className="text-body-xs-regular text-tertiary">{t(`${provider.key}_integration.description`)}</p>

      {isSupported ? (
        <div className="flex-shrink-0">
          <Link href={`/${workspaceSlug}/settings/integrations/${provider.urlSlug}`}>
            <span>
              <Button variant="secondary">{t("integrations.configure")}</Button>
            </span>
          </Link>
        </div>
      ) : (
        <Tooltip
          tooltipContent={
            isSelfManaged
              ? t("integrations.not_configured_message_admin", { name: provider.title })
              : t("integrations.not_configured_message_support", {
                  name: provider.title,
                })
          }
        >
          <div className="flex gap-1.5 cursor-help flex-shrink-0 items-center text-secondary">
            <InfoIcon height={12} width={12} />
            <div className="text-caption-sm-regular">{t("integrations.not_configured")}</div>
          </div>
        </Tooltip>
      )}
    </div>
  );
}
