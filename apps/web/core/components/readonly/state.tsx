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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { StateGroupIcon } from "@plane/propel/icons";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { ProjectStateIcon } from "@/components/workspace-project-states/project-state-icon";
import { EProjectStateGroup } from "@/types/workspace-project-states";
import type { TProjectStateGroupKey } from "@/types/workspace-project-states";
import type { TStateGroups } from "@plane/types";

export type TReadonlyStateProps = {
  className?: string;
  iconSize?: string;
  hideIcon?: boolean;
  value: string | undefined | null;
  placeholder?: string;
  projectId?: string | undefined;
  workspaceSlug: string;
};

export const ReadonlyState = observer(function ReadonlyState(props: TReadonlyStateProps) {
  const { className, iconSize = "size-4", hideIcon = false, value, placeholder, projectId, workspaceSlug } = props;
  // states
  const [stateLoader, setStateLoader] = useState(false);
  const { t } = useTranslation();
  const { getStateById, getProjectStateIds, fetchProjectStates } = useProjectState();
  const {
    getProjectStateById: getWorkspaceProjectStateById,
    getProjectStateIdsWithGroupingByWorkspaceId: getWorkspaceProjectStateIdsWithGroupingByWorkspaceId,
    fetchProjectStates: fetchWorkspaceProjectStates,
  } = useWorkspaceProjectStates();
  // derived values
  const stateIds = projectId
    ? getProjectStateIds(projectId)
    : Object.values(getWorkspaceProjectStateIdsWithGroupingByWorkspaceId(workspaceSlug) ?? {}).flat();
  const state = projectId ? getStateById(value) : getWorkspaceProjectStateById(value ?? "");

  // fetch states if not provided
  const fetchStates = async () => {
    if ((stateIds === undefined || stateIds.length === 0) && projectId) {
      setStateLoader(true);
      try {
        if (projectId) {
          await fetchProjectStates(workspaceSlug, projectId);
        } else {
          await fetchWorkspaceProjectStates(workspaceSlug);
        }
      } finally {
        setStateLoader(false);
      }
    }
  };

  useEffect(() => {
    void fetchStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, workspaceSlug]);

  if (stateLoader) {
    return (
      <Loader className={cn("flex items-center gap-1 text-body-xs-regular", className)}>
        <Loader.Item height="16px" width="16px" className="rounded-full" />
        <Loader.Item height="16px" width="50px" />
      </Loader>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 text-body-xs-regular", className)}>
      {!hideIcon &&
        (projectId ? (
          <StateGroupIcon
            stateGroup={(state?.group as TStateGroups) ?? "backlog"}
            className={cn(iconSize, "flex-shrink-0")}
            color={state?.color}
          />
        ) : (
          <ProjectStateIcon
            projectStateGroup={(state?.group as TProjectStateGroupKey) ?? EProjectStateGroup.DRAFT}
            color={state?.color}
            width="12"
            height="12"
          />
        ))}
      <span className="flex-grow truncate">{state?.name ?? placeholder ?? t("common.none")}</span>
    </div>
  );
});
