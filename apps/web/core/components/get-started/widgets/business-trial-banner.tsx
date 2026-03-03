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
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { Gem } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EPillSize, ERadius, Pill } from "@plane/propel/pill";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type Props = {
  variant?: "default" | "compact";
};

export const BusinessTrialBanner: FC<Props> = observer(({ variant = "default" }) => {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  const {
    currentWorkspaceSubscribedPlanDetail: subscriptionDetail,
    togglePaidPlanModal,
    getIsInTrialPeriod,
  } = useWorkspaceSubscription();
  const isOnTrialPeriod = getIsInTrialPeriod(false);

  const isWorkspaceAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  // Check if subscription detail is available and workspace is in an active trial period
  if (!subscriptionDetail || !isOnTrialPeriod) {
    return null;
  }

  const { remaining_trial_days } = subscriptionDetail;

  // Hide if trial expired or days invalid
  if (typeof remaining_trial_days !== "number" || remaining_trial_days < 0) {
    return null;
  }

  const handleStartSubscription = () => {
    togglePaidPlanModal(true);
  };

  const handleExploreFeatures = () => {
    router.push(`/${workspaceSlug}/settings/billing`);
  };

  const trialDaysPill = (
    // TODO-@plane/propel/pill: update pill variant once it is fix
    <Pill size={EPillSize.SM} radius={ERadius.SQUARE} className="text-label-yellow-text bg-label-yellow-bg border-none">
      {remaining_trial_days === 0
        ? t("home.business_trial_banner.trial_ends_today")
        : t("home.business_trial_banner.trial_ends_in_days", {
            days: remaining_trial_days,
          })}
    </Pill>
  );

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-layer-2 border border-subtle w-full">
        <div className="flex items-center justify-center p-2 rounded-lg bg-plans-brand-subtle shrink-0">
          <Gem className="size-5 text-plans-brand-primary" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-body-sm-semibold text-plans-brand-primary shrink-0">
              {t("home.business_trial_banner.title")}
            </p>
            {trialDaysPill}
          </div>
          <p className="text-caption-md-regular text-tertiary">{t("home.business_trial_banner.description")}</p>
        </div>
        {isWorkspaceAdmin && (
          <Button variant="primary" onClick={handleStartSubscription} size="lg" className="shrink-0">
            {t("home.business_trial_banner.start_subscription")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 rounded-xl bg-layer-2 border border-subtle w-full shadow-raised-100">
      <div className="flex flex-col gap-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-plans-brand-subtle text-plans-brand-primary">
          <Gem className="size-4" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h3 className="text-h6-medium text-primary">{t("home.business_trial_banner.title")}</h3>
            {trialDaysPill}
          </div>
          <p className="text-body-xs-regular text-tertiary">{t("home.business_trial_banner.description")}</p>
        </div>
      </div>

      {isWorkspaceAdmin && (
        <div className="flex shrink-0 gap-2.5">
          <Button variant="primary" onClick={handleStartSubscription} size="lg">
            {t("home.business_trial_banner.start_subscription")}
          </Button>
          <Button variant="secondary" onClick={handleExploreFeatures} size="lg">
            {t("home.business_trial_banner.explore_business_features")}
          </Button>
        </div>
      )}
    </div>
  );
});
