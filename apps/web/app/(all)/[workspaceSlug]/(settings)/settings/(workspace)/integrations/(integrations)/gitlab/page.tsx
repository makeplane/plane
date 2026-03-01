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

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
// plane web components components
import { Cloud } from "lucide-react";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { SILO_ERROR_CODES } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { Loader } from "@plane/ui";
import { UserAuthentication, IntegrationRoot, GitlabHeader } from "@/components/integrations/gitlab";
// plane web hooks
import { useFlag, useGitlabIntegration, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// public images
import { SiloAppService } from "@/services/integrations/silo.service";

const siloAppService = new SiloAppService();

function GitlabIntegration() {
  // hooks
  const searchParams = useSearchParams();
  const {
    workspace,
    externalApiToken,
    fetchExternalApiToken,
    auth: { workspaceConnectionIds, workspaceConnectionById },
  } = useGitlabIntegration();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const isFeatureEnabled = useFlag(workspaceSlug?.toString() || "", E_FEATURE_FLAGS.GITLAB_INTEGRATION) || false;
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const organization = workspaceConnectionId ? workspaceConnectionById(workspaceConnectionId) : undefined;
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();

  const { t } = useTranslation();

  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;

  // Fetch Supported Integrations
  const {
    data: supportedIntegrations,
    isLoading: supportedIntegrationsLoading,
    error: supportedIntegrationsError,
  } = useSWR(`SILO_SUPPORTED_INTEGRATIONS`, () => siloAppService.getSupportedIntegrations(), {
    revalidateOnFocus: false,
  });

  // fetching external api token
  const { isLoading: externalApiTokenIsLoading } = useSWR(
    isFeatureEnabled && workspaceSlug && !externalApiToken ? `IMPORTER_EXTERNAL_SERVICE_TOKEN_${workspaceSlug}` : null,
    isFeatureEnabled && workspaceSlug && !externalApiToken ? async () => fetchExternalApiToken(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  // error message
  const errorCode = searchParams.get("error");
  useEffect(() => {
    if (!errorCode) {
      return;
    }

    const message = SILO_ERROR_CODES.find((code) => String(code.code) === errorCode)?.description;
    if (message) {
      setToast({
        title: "Error",
        message: t(`silo_errors.${message}`),
        type: TOAST_TYPE.ERROR,
      });
    }
  }, [errorCode]);

  if (!isFeatureEnabled) return null;

  if ((!externalApiToken && externalApiTokenIsLoading) || (!supportedIntegrations && supportedIntegrationsLoading))
    return (
      <div className="relative space-y-6">
        {/* header */}
        <GitlabHeader isEnterprise={false} />
        <div className="flex flex-col border border-subtle rounded-sm p-4 mb-2 justify-center">
          {/* Icon and Title Section */}
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

  if (supportedIntegrationsError)
    return (
      <div className="text-secondary relative flex justify-center items-center">
        {t("integrations.error_fetching_supported_integrations")}
      </div>
    );

  if (supportedIntegrations && !supportedIntegrations.includes(E_INTEGRATION_KEYS.GITLAB))
    return (
      <div className={"flex h-full flex-col items-center justify-center"}>
        <Cloud size={96} />
        <div className="text-secondary text-center text-body-xs-regular relative flex justify-center items-center">
          {isSelfManaged
            ? t("integrations.not_configured_message_admin", { name: "Gitlab" })
            : t("integrations.not_configured_message_support", { name: "Gitlab" })}
        </div>
      </div>
    );

  return (
    <div className="relative space-y-6">
      {/* header */}
      <GitlabHeader isEnterprise={false} />

      {/* integration auth root */}
      <UserAuthentication isEnterprise={false} />

      {/* integration root */}
      {organization && <IntegrationRoot isEnterprise={false} />}
    </div>
  );
}

export default observer(GitlabIntegration);
