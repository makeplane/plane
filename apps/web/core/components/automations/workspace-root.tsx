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
import { Button } from "@plane/propel/button";
// components;
import { WorkspaceAutomationsListRoot } from "@/components/automations/list/workspace-root";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type TProps = {
  workspaceSlug: string;
};

export const WorkspaceCustomAutomationsRoot = observer(function WorkspaceCustomAutomationsRoot(props: TProps) {
  const { workspaceSlug } = props;
  // store hooks
  const {
    workspaceAutomations: { isAnyAutomationAvailableForWorkspace, getCanCreateAutomation, setCreateUpdateModalConfig },
  } = useAutomations();
  // translation
  const { t } = useTranslation();
  // derived values
  const canCreate = getCanCreateAutomation(workspaceSlug);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center justify-between border-b border-subtle py-4">
        <div className="flex flex-col items-start gap-1">
          <h4 className="text-14 font-medium">{t("automations.settings.title")}</h4>
        </div>
        {isAnyAutomationAvailableForWorkspace(workspaceSlug) && canCreate && (
          <Button variant="primary" onClick={() => setCreateUpdateModalConfig({ isOpen: true, payload: null })}>
            {t("automations.settings.create_automation")}
          </Button>
        )}
      </div>
      <WorkspaceAutomationsListRoot workspaceSlug={workspaceSlug} />
    </>
  );
});
