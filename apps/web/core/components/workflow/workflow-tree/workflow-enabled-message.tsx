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
// hooks
import { StatePropertyIcon } from "@plane/propel/icons";
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import { WorkflowTree } from "./workflow-tree";

type Props = {
  parentStateId: string;
};

export const WorkFlowEnabledMessage = observer(function WorkFlowEnabledMessage(props: Props) {
  const { parentStateId } = props;
  // plane imports
  const { t } = useTranslation();
  // store hooks
  const { getStateById } = useProjectState();
  // derived state
  const parentState = getStateById(parentStateId);

  if (!parentState) return <></>;

  return (
    <div className="relative w-72 flex flex-col gap-2">
      <div className="flex gap-1 items-center">
        <StatePropertyIcon className="size-3 text-secondary" />
        <span className="text-11 font-medium">{t("workflows.workflow_enabled.label")}</span>
      </div>
      <div className="pl-4">
        <WorkflowTree parentStateId={parentStateId} />
      </div>
    </div>
  );
});
