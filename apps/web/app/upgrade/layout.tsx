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

import { observer } from "mobx-react";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import Link from "next/link";
import { useParams } from "next/navigation";
// plane imports
import type { EExternalUpgradePlanType } from "@plane/constants";
import { GOOGLE_ANALYTICS_ID } from "@plane/constants";
import { PlaneIcon } from "@plane/propel/icons";
import {
  getBaseUpgradePath,
  getSubscriptionName,
  getSubscriptionTypeFromExternalUpgradePlanTypeEnum,
} from "@plane/utils";
// components
import { PageHead } from "@/components/core/page-title";
import { SwitchAccountDropdown } from "@/components/onboarding/switch-account-dropdown";
// hooks
import { useInstance } from "@/hooks/store/use-instance";

const UpgradeLayout = observer(function UpgradeLayout() {
  // router
  const { planType } = useParams();
  const { config } = useInstance();
  const navigate = useNavigate();
  // derived values
  const isSelfManaged = config?.is_self_managed;
  const subscriptionType = planType
    ? getSubscriptionTypeFromExternalUpgradePlanTypeEnum(planType as EExternalUpgradePlanType)
    : null;

  useEffect(() => {
    if (isSelfManaged) {
      void navigate("/", { replace: true });
    }
  }, [isSelfManaged, navigate]);

  if (isSelfManaged) {
    return null;
  }

  return (
    <>
      <div className="h-screen w-full overflow-hidden bg-surface-2">
        <PageHead title="Upgrade - Plane" />
        <div className="relative z-10 w-screen h-screen overflow-hidden overflow-y-auto flex flex-col">
          <div className="container mx-auto px-10 lg:px-0 shrink-0 relative flex items-center justify-between pb-4 transition-all">
            {subscriptionType && (
              <div className={"flex items-center gap-x-2 py-10 text-accent-primary"}>
                <Link
                  href={getBaseUpgradePath(planType as EExternalUpgradePlanType)}
                  className="flex items-center gap-x-2 w-full"
                >
                  <PlaneIcon className="size-7" />
                  <div className="text-h3-bold">{getSubscriptionName(subscriptionType)}</div>
                </Link>
              </div>
            )}
            <div className="flex flex-col items-end sm:items-center sm:gap-2 sm:flex-row text-center text-body-xs-medium text-tertiary">
              <SwitchAccountDropdown />
            </div>
          </div>
          <div className="flex flex-col justify-center container h-[calc(100vh-240px)] mx-auto max-w-lg px-10 lg:max-w-md lg:px-5 transition-all">
            <Outlet />
          </div>
        </div>
      </div>
      {GOOGLE_ANALYTICS_ID && (
        <>
          <script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`} id="google-analytics" />
          <script
            async
            src="https://tag.clearbitscripts.com/v1/pk_12bcecff2ad52af4201b104045511543/tags.js"
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <script
            id="google-analytics-config"
            dangerouslySetInnerHTML={{
              __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ANALYTICS_ID}');
          `,
            }}
          />
        </>
      )}
    </>
  );
});

export default UpgradeLayout;
