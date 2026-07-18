/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { GitBranchIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { StateGroupIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssueGroupByOptions } from "@plane/types";
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  groupBy?: TIssueGroupByOptions;
  groupId: string | undefined;
};

/**
 * Small board group-header indicator shown when the group's state has
 * restricted outgoing transitions; the tooltip lists the allowed targets.
 */
export const WorkFlowGroupTree = observer(function WorkFlowGroupTree(props: Props) {
  const { groupBy, groupId } = props;
  const { projectId } = useParams();
  const { t } = useTranslation();
  const { getAllowedTransitionIds, getStateById } = useProjectState();

  if (groupBy !== "state" || !groupId) return <></>;

  const allowedTransitionIds = getAllowedTransitionIds(projectId?.toString(), groupId);
  if (allowedTransitionIds === undefined) return <></>;

  const allowedStates = allowedTransitionIds.map((stateId) => getStateById(stateId)).filter((state) => !!state);

  return (
    <Tooltip
      tooltipContent={
        <div className="flex flex-col gap-1 p-0.5">
          <span className="font-medium">{t("workflows.status_workflow.allowed_transitions")}</span>
          {allowedStates.map((state) => (
            <span key={state.id} className="flex items-center gap-1">
              <StateGroupIcon stateGroup={state.group} color={state.color} className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{state.name}</span>
            </span>
          ))}
        </div>
      }
      position="bottom"
    >
      <span className="flex flex-shrink-0 items-center text-tertiary">
        <GitBranchIcon className="h-3 w-3" />
      </span>
    </Tooltip>
  );
});
