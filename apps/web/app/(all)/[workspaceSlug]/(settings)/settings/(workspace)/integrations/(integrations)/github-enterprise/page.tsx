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
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane web components components
import { Cloud } from "lucide-react";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { SILO_ERROR_CODES } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { E_INTEGRATION_KEYS } from "@plane/types";
// assets
import GithubDarkLogo from "@/app/assets/services/github-dark.svg?url";
import GithubLightLogo from "@/app/assets/services/github-light.svg?url";
// plane web imports
import { UserAuthentication, IntegrationRoot } from "@/components/integrations/github";
import { useFlag, useGithubIntegration, useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { SiloAppService } from "@/services/integrations/silo.service";

const siloAppService = new SiloAppService();

function GitHubEnterpriseIntegration() {
  // hooks
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const {
    workspace,
    externalApiToken,
    fetchExternalApiToken,
    auth: { workspaceConnectionIds, workspaceConnectionById },
  } = useGithubIntegration(true);

  const { t } = useTranslation();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const isFeatureEnabled =
    useFlag(workspaceSlug?.toString() || "", E_FEATURE_FLAGS.GITHUB_ENTERPRISE_INTEGRATION) || false;
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const organization = workspaceConnectionId ? workspaceConnectionById(workspaceConnectionId) : undefined;
  const githubLogo = resolvedTheme === "dark" ? GithubLightLogo : GithubDarkLogo;
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();

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
  const errorCode = searchParams?.get("error");
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
    return <div className="text-secondary relative flex justify-center items-center">{t("integrations.loading")}</div>;

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

  if (supportedIntegrations && !supportedIntegrations.includes(E_INTEGRATION_KEYS.GITHUB_ENTERPRISE))
    return (
      <div className={"flex h-full flex-col items-center justify-center"}>
        <Cloud size={96} />
        <div className="text-secondary text-center text-body-sm-regular relative flex justify-center items-center">
          {isSelfManaged
            ? t("integrations.not_configured_message_admin", { name: "GitHub Enterprise Server" })
            : t("integrations.not_configured_message_support", { name: "GitHub Enterprise Server" })}
        </div>
      </div>
    );

  return (
    <div className="relative space-y-10">
      {/* header */}
      <div className="flex-shrink-0 relative flex items-center gap-4 rounded-sm bg-layer-1 p-4">
        <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
          <img src={githubLogo} alt="GitHub Logo" />
        </div>
        <div>
          <div className="text-body-sm-medium">GitHub Enterprise Server</div>
          <div className="text-body-xs-regular text-secondary">{t("github_enterprise_integration.description")}</div>
        </div>
      </div>

      {/* integration auth root */}
      <UserAuthentication isEnterprise />

      {/* integration root */}
      {organization && <IntegrationRoot isEnterprise />}
    </div>
  );
}

export default observer(GitHubEnterpriseIntegration);
