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
import { Cloud } from "lucide-react";
// plane web components
import { SILO_ERROR_CODES } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { Loader } from "@plane/ui";
import { SentryIntegrationRoot } from "@/components/integrations/sentry";
//  plane web hooks
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web constants
import { SiloAppService } from "@/services/integrations/silo.service";
import type { Route } from "./+types/page";

const siloAppService = new SiloAppService();

function SentryIntegration({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  const searchParams = useSearchParams();
  // derived values
  const isFeatureEnabled = useFlag(workspaceSlug, "SENTRY_INTEGRATION");
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
  const { t } = useTranslation();

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

  if (!supportedIntegrations && supportedIntegrationsLoading)
    return <div className="text-secondary relative flex justify-center items-center">{t("integrations.loading")}</div>;

  if (!isFeatureEnabled)
    return (
      <div className="text-secondary relative flex justify-center items-center">
        {t("integrations.not_enabled", { name: "Sentry" })}
      </div>
    );

  if (supportedIntegrationsError)
    return (
      <div className="text-secondary relative flex justify-center items-center">
        {t("integrations.error_fetching_supported_integrations")}
      </div>
    );

  if (supportedIntegrations && !supportedIntegrations.includes(E_INTEGRATION_KEYS.SENTRY))
    return (
      <div className={"flex h-full flex-col items-center justify-center"}>
        <Cloud size={96} />
        <div className="text-secondary text-center text-body-xs-regular relative flex justify-center items-center">
          {isSelfManaged
            ? t("integrations.not_configured_message_admin", { name: "Sentry" })
            : t("integrations.not_configured_message_support", { name: "Sentry" })}
        </div>
      </div>
    );

  return (
    <div className="space-y-6 relative w-full h-full overflow-auto flex flex-col">
      {supportedIntegrationsLoading ? (
        <Loader className="w-full h-full flex flex-col gap-8">
          <Loader.Item width="100%" height="60px" />
          <Loader.Item width="100%" height="40px" />
          <Loader.Item width="200px" height="30px" />
          <Loader.Item width="100%" height="45px" />
          <Loader.Item width="100%" height="45px" />
        </Loader>
      ) : (
        <SentryIntegrationRoot />
      )}
    </div>
  );
}

export default observer(SentryIntegration);
