"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// ce imports
import { TCustomAutomationsRootProps } from "@/ce/components/automations/root";
// plane web imports
import { CreateAutomationButton } from "@/plane-web/components/automations/create-button";
import { AutomationsListRoot } from "@/plane-web/components/automations/list/root";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags/with-feature-flag-hoc";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

export const CustomAutomationsRoot: FC<TCustomAutomationsRootProps> = observer((props) => {
  const { projectId, workspaceSlug } = props;
  // store hooks
  const {
    projectAutomations: { isAnyAutomationAvailableForProject, canCurrentUserCreateAutomation },
  } = useAutomations();
  // translation
  const { t } = useTranslation();

  // TODO: Add upgrade empty state as fallback
  return (
    <WithFeatureFlagHOC flag="PROJECT_AUTOMATIONS" fallback={<></>} workspaceSlug={workspaceSlug}>
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center justify-between border-b border-custom-border-100 py-4">
        <div className="flex flex-col items-start gap-1">
          <h4 className="text-base font-medium">{t("automations.settings.title")}</h4>
        </div>
        {isAnyAutomationAvailableForProject(projectId) && canCurrentUserCreateAutomation && <CreateAutomationButton />}
      </div>
      <AutomationsListRoot projectId={projectId} />
    </WithFeatureFlagHOC>
  );
});
