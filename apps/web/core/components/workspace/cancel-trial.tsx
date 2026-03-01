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
import { useParams } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TProps = { setActiveSubscriptionModal: (value: boolean) => void };

export function CancelTrial(props: TProps) {
  const { setActiveSubscriptionModal } = props;
  // router
  const { workspaceSlug } = useParams();
  // state
  const [isSubmitting, setIsSubmitting] = useState(false);
  //hooks
  const { cancelFreeTrial } = useWorkspaceSubscription();
  const { t } = useTranslation();

  const handleTrialCancellation = async () => {
    setIsSubmitting(true);
    await cancelFreeTrial(workspaceSlug.toString())
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.cancel_trial.cancel_success_title"),
          message: t("workspace_settings.settings.cancel_trial.cancel_success_message"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workspace_settings.settings.cancel_trial.cancel_error_title"),
          message: t("workspace_settings.settings.cancel_trial.cancel_error_message"),
        });
      });
    setIsSubmitting(false);
  };

  return (
    <div>
      <div className="p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <span
          className={cn(
            "flex-shrink-0 grid place-items-center rounded-full size-12 sm:size-10 bg-accent-primary/20 text-accent-primary"
          )}
        >
          <CircleAlert className="size-5" aria-hidden="true" />
        </span>
        <div className="text-center sm:text-left">
          <h3 className="text-16 font-medium">{t("workspace_settings.settings.cancel_trial.title")}</h3>
          <p className="mt-1 text-13 text-secondary">{t("workspace_settings.settings.cancel_trial.description")}</p>
        </div>
      </div>
      <div className="px-5 pb-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button variant="secondary" onClick={() => setActiveSubscriptionModal(false)}>
          {t("workspace_settings.settings.cancel_trial.dismiss")}
        </Button>
        <Button variant="error-fill" type="submit" loading={isSubmitting} onClick={handleTrialCancellation}>
          {isSubmitting ? t("common.cancelling") : t("workspace_settings.settings.cancel_trial.cancel")}
        </Button>
      </div>
    </div>
  );
}
