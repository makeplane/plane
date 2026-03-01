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
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { CreateAutomationButton } from "@/components/automations/create-button";
import { AutomationsListRoot } from "@/components/automations/list/root";
import { WithFeatureFlagHOC } from "@/components/feature-flags/with-feature-flag-hoc";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

export type TCustomAutomationsRootProps = {
  projectId: string;
  workspaceSlug: string;
};

export const CustomAutomationsRoot = observer(function CustomAutomationsRoot(props: TCustomAutomationsRootProps) {
  const { projectId, workspaceSlug } = props;
  // store hooks
  const {
    projectAutomations: { isAnyAutomationAvailableForProject, canCurrentUserCreateAutomation },
  } = useAutomations();
  // translation
  const { t } = useTranslation();

  return (
    <WithFeatureFlagHOC flag="PROJECT_AUTOMATIONS" fallback={<></>} workspaceSlug={workspaceSlug}>
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center justify-between border-b border-subtle py-4">
        <div className="flex flex-col items-start gap-1">
          <h4 className="text-14 font-medium">{t("automations.settings.title")}</h4>
        </div>
        {isAnyAutomationAvailableForProject(projectId) && canCurrentUserCreateAutomation && <CreateAutomationButton />}
      </div>
      <AutomationsListRoot projectId={projectId} />
    </WithFeatureFlagHOC>
  );
});
