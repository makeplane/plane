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
import Link from "next/link";
import useSWR from "swr";
import { CalendarCheck } from "lucide-react";
// plane imports
import { PriorityIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { IActiveCycle } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { Loader } from "@plane/ui";
import { generateWorkItemLink, renderFormattedDate, renderFormattedDateWithoutYear } from "@plane/utils";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
// constants
import { CYCLE_ISSUES_WITH_PARAMS } from "@/constants/fetch-keys";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
// plane web imports
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";

export type ActiveCyclePriorityIssuesProps = {
  workspaceSlug: string;
  projectId: string;
  cycle: IActiveCycle;
};

export const ActiveCyclePriorityIssues = observer(function ActiveCyclePriorityIssues(
  props: ActiveCyclePriorityIssuesProps
) {
  const { workspaceSlug, projectId, cycle } = props;
  // store hooks
  const {
    issues: { fetchActiveCycleIssues },
  } = useIssues(EIssuesStoreType.CYCLE);
  const { fetchWorkspaceStates } = useProjectState();
  const { getProjectIdentifierById } = useProject();

  // derived values
  const projectIdentifier = getProjectIdentifierById(projectId);

  const { data: activeCycleIssues } = useSWR(
    workspaceSlug && projectId && cycle.id ? CYCLE_ISSUES_WITH_PARAMS(cycle.id, { priority: "urgent,high" }) : null,
    workspaceSlug && projectId && cycle.id
      ? () => fetchActiveCycleIssues(workspaceSlug, projectId, 10, cycle.id)
      : null,
    {
      revalidateOnFocus: false,
    }
  );

  useSWR(
    workspaceSlug ? `WORKSPACE_STATES_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchWorkspaceStates(workspaceSlug.toString()) : null
  );

  return (
    <div className="flex flex-col gap-4 p-4 min-h-52 overflow-hidden col-span-1 lg:col-span-2 xl:col-span-1 border border-subtle-1 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-16 text-tertiary font-medium">High-priority work items</h3>
      </div>
      <div className="flex flex-col gap-1 h-full w-full max-h-40 overflow-y-auto">
        {activeCycleIssues ? (
          activeCycleIssues.count > 0 && Array.isArray(activeCycleIssues.results) ? (
            activeCycleIssues.results.map((issue) => (
              <Link
                key={issue.id}
                href={generateWorkItemLink({
                  workspaceSlug,
                  projectId: issue?.project_id,
                  issueId: issue?.id,
                  projectIdentifier,
                  sequenceId: issue?.sequence_id,
                })}
                className="group flex cursor-pointer items-center justify-between gap-2 rounded-md hover:bg-layer-1 p-1"
              >
                <div className="flex items-center gap-1.5 flex-grow w-full truncate">
                  <IssueIdentifier issueId={issue.id} projectId={projectId} size="xs" variant="secondary" />
                  <Tooltip position="top-start" tooltipHeading="Title" tooltipContent={issue.name}>
                    <span className="text-[0.825rem] text-primary truncate">{issue.name}</span>
                  </Tooltip>
                </div>
                <PriorityIcon priority={issue.priority} withContainer size={12} />
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StateDropdown
                    value={issue.state_id ?? undefined}
                    onChange={() => {}}
                    projectId={projectId?.toString() ?? ""}
                    buttonVariant="background-with-text"
                    buttonContainerClassName="cursor-pointer"
                    buttonClassName="group-hover:bg-surface-1"
                  />
                  {issue.target_date && (
                    <Tooltip tooltipHeading="Target Date" tooltipContent={renderFormattedDate(issue.target_date)}>
                      <div className="h-full flex items-center gap-1.5 rounded-sm text-11 px-2 py-0.5 bg-layer-1 group-hover:bg-surface-1 cursor-pointer">
                        <CalendarCheck className="h-3 w-3 flex-shrink-0" />
                        <span className="text-11">{renderFormattedDateWithoutYear(issue.target_date)}</span>
                      </div>
                    </Tooltip>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-13 text-secondary">
              <span>There are no high priority work items present in this cycle.</span>
            </div>
          )
        ) : (
          <Loader className="space-y-3">
            <Loader.Item height="50px" />
            <Loader.Item height="50px" />
            <Loader.Item height="50px" />
          </Loader>
        )}
      </div>
    </div>
  );
});
