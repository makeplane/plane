/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { LockIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { StateGroupIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  parentStateId: string;
  className?: string;
};

export const WorkFlowDisabledMessage = observer(function WorkFlowDisabledMessage(props: Props) {
  const { parentStateId, className = "" } = props;
  const { t } = useTranslation();
  const { getStateById } = useProjectState();

  const parentState = getStateById(parentStateId);

  return (
    <div className={cn("flex flex-col items-center gap-1.5 rounded-sm p-3 text-danger-secondary", className)}>
      <div className="flex items-center gap-1.5">
        <LockIcon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="font-medium">{t("workflows.status_workflow.drop_not_allowed")}</span>
      </div>
      {parentState && (
        <div className="flex items-center gap-1.5 text-13">
          <span>{t("workflows.status_workflow.moving_from")}</span>
          <span className="flex items-center gap-1 rounded-sm bg-layer-1 px-1.5 py-0.5">
            <StateGroupIcon
              stateGroup={parentState.group}
              color={parentState.color}
              className="h-3 w-3 flex-shrink-0"
            />
            <span className="truncate">{parentState.name}</span>
          </span>
          <span>{t("workflows.status_workflow.is_restricted")}</span>
        </div>
      )}
    </div>
  );
});
