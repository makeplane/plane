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
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useProject } from "@/hooks/store/use-project";
// i18n
type TEstimateDisableSwitch = {
  workspaceSlug: string;
  projectId: string;
};

export const EstimateDisableSwitch = observer(function EstimateDisableSwitch(props: TEstimateDisableSwitch) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { updateProject, currentProjectDetails } = useProject();
  const { getCanCurrentUserCreateEstimate, currentActiveEstimateId } = useProjectEstimates();
  // derived values
  const currentProjectActiveEstimate = currentProjectDetails?.estimate || undefined;
  // auth
  const canDisable = getCanCurrentUserCreateEstimate(workspaceSlug, projectId);
  // translation
  const { t } = useTranslation();

  const disableEstimate = async () => {
    if (!workspaceSlug || !projectId) return;

    try {
      await updateProject(workspaceSlug, projectId, {
        estimate: currentProjectActiveEstimate ? null : currentActiveEstimateId,
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: currentProjectActiveEstimate
          ? t("project_settings.estimates.toasts.disabled.success.title")
          : t("project_settings.estimates.toasts.enabled.success.title"),
        message: currentProjectActiveEstimate
          ? t("project_settings.estimates.toasts.disabled.success.message")
          : t("project_settings.estimates.toasts.enabled.success.message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_settings.estimates.toasts.disabled.error.title"),
        message: t("project_settings.estimates.toasts.disabled.error.message"),
      });
    }
  };

  return <Switch value={Boolean(currentProjectActiveEstimate)} onChange={disableEstimate} disabled={!canDisable} />;
});
