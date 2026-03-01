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

import { uniq } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ApproverIcon, WorkflowIcon } from "@plane/propel/icons";
import type { TStateTransitionMap } from "@plane/types";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";

type Props = {
  currentTransitionMap?: TStateTransitionMap;
};

export const StateTransitionCount = observer(function StateTransitionCount(props: Props) {
  const { currentTransitionMap } = props;
  //router
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const isWorkflowEnabled = useFlag(workspaceSlug.toString(), E_FEATURE_FLAGS.WORKFLOWS);
  const transitionsCount = Object.keys(currentTransitionMap ?? {}).length;
  // unique approvers
  const uniqueApproversCount = uniq(
    Object.values(currentTransitionMap ?? {}).reduce<string[]>((acc, curr) => [...acc, ...(curr.approvers ?? [])], [])
  ).length;

  if (!isWorkflowEnabled) return <></>;

  return (
    <div className="flex w-full grow items-center gap-1">
      {transitionsCount > 0 && (
        <>
          <div className="flex px-1 py-0.5 items-center">
            <WorkflowIcon className="flex-shrink-0 size-3.5 text-tertiary" strokeWidth={2} />
            <span className="text-11 font-medium text-placeholder line-clamp-1 pl-1">
              <span className="hidden lg:block">
                {t("workflows.workflow_states.state_change_count", { count: transitionsCount })}
              </span>
              <span className="block lg:hidden">{transitionsCount}</span>
            </span>
          </div>
        </>
      )}
      {uniqueApproversCount > 0 && (
        <>
          <svg viewBox="0 0 2 2" className="flex-shrink-0 h-1 w-1 text-tertiary">
            <circle cx={1} cy={1} r={1} className="fill-current" />
          </svg>
          <div className="flex px-1 py-0.5 items-center">
            <ApproverIcon className="flex-shrink-0 size-3.5 text-tertiary" strokeWidth={2} />
            <span className="text-11 font-medium text-placeholder line-clamp-1 pl-1">
              <span className="hidden lg:block">
                {t("workflows.workflow_states.movers_count", { count: uniqueApproversCount })}
              </span>
              <span className="block lg:hidden">{uniqueApproversCount}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
});
