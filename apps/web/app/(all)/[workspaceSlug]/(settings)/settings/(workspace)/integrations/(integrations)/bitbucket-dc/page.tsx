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

"use client";

import { observer } from "mobx-react";
import useSWR from "swr";
import { Cloud } from "lucide-react";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { BitbucketHeader, IntegrationRoot, UserAuthentication } from "@/components/integrations/bitbucket-dc";
import { useFlag, useBitbucketDCIntegration, useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { SiloAppService } from "@/services/integrations/silo.service";

const siloAppService = new SiloAppService();

function BitbucketIntegration() {
  const {
    workspace,
    externalApiToken,
    fetchExternalApiToken,
    auth: { workspaceConnectionIds, workspaceConnectionById },
  } = useBitbucketDCIntegration();
  const { t } = useTranslation();

  const workspaceSlug = workspace?.slug;
  const isFeatureEnabled = useFlag(workspaceSlug?.toString() || "", E_FEATURE_FLAGS.BITBUCKET_DC_INTEGRATION);
  const connectionId = workspaceConnectionIds[0];
  const connection = connectionId ? workspaceConnectionById(connectionId) : undefined;
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  const isSelfManaged = subscriptionDetail?.is_self_managed;

  const { data: supportedIntegrations, isLoading: supportedIntegrationsLoading } = useSWR(
    `SILO_SUPPORTED_INTEGRATIONS`,
    () => siloAppService.getSupportedIntegrations(),
    { revalidateOnFocus: false }
  );

  const { isLoading: externalApiTokenIsLoading } = useSWR(
    isFeatureEnabled && workspaceSlug && !externalApiToken ? `IMPORTER_EXTERNAL_SERVICE_TOKEN_${workspaceSlug}` : null,
    isFeatureEnabled && workspaceSlug && !externalApiToken ? () => fetchExternalApiToken(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  if (!isFeatureEnabled) return null;

  if ((!externalApiToken && externalApiTokenIsLoading) || (!supportedIntegrations && supportedIntegrationsLoading))
    return (
      <div className="relative space-y-6">
        <BitbucketHeader />
        <div className="flex flex-col border border-subtle rounded-sm p-4 mb-2 justify-center">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Loader>
                <Loader.Item height="44px" width="44px" />
              </Loader>
              <Loader>
                <Loader.Item height="24px" width="80px" />
              </Loader>
            </div>
            <Loader.Item height="29px" width="80px" />
          </div>
        </div>
      </div>
    );

  if (!externalApiToken)
    return (
      <div className="text-secondary relative flex justify-center items-center">
        {t("integrations.external_api_unreachable")}
      </div>
    );

  if (supportedIntegrations && !supportedIntegrations.includes(E_INTEGRATION_KEYS.BITBUCKET_DC))
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Cloud size={96} />
        <div className="text-secondary text-center text-body-sm-regular relative flex justify-center items-center">
          {isSelfManaged
            ? t("integrations.not_configured_message_admin", { name: "Bitbucket Data Center" })
            : t("integrations.not_configured_message_support", { name: "Bitbucket Data Center" })}
        </div>
      </div>
    );

  return (
    <div className="relative space-y-6">
      <BitbucketHeader />
      <UserAuthentication />
      {connection && <IntegrationRoot />}
    </div>
  );
}

export default observer(BitbucketIntegration);
