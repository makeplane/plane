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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Maximize2, Minimize2 } from "lucide-react";
// plane imports
import { IconButton } from "@plane/propel/icon-button";
import { PlusIcon } from "@plane/propel/icons";
// components
import { CreateProjectModal } from "@/components/projects/modals/create-project-modal";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useWorkspaceProjectLabels } from "@/hooks/store/use-workspace-project-labels";
// plane web imports
import { useProjectFilter, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
// local imports
import { groupDetails } from "../utils";
import type { ProjectLayoutPermissions } from "@/store/project/permissions/root";

type TProjectBoardGroupItemHeader = {
  groupByKey: string;
  projectIds: string[];
  verticalAlign: boolean;
  setVerticalAlign: (
    value: (state: { [key: string]: boolean }) => {
      [key: string]: boolean;
    }
  ) => void;
  permissions: ProjectLayoutPermissions;
};

export const ProjectBoardGroupItemHeader = observer(function ProjectBoardGroupItemHeader(
  props: TProjectBoardGroupItemHeader
) {
  const { groupByKey, projectIds, verticalAlign, setVerticalAlign, permissions } = props;
  // states
  const [open, setOpen] = useState(false);
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { filters } = useProjectFilter();
  const { getProjectStateById, getProjectStatedByStateGroupKey } = useWorkspaceProjectStates();
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();
  const { currentWorkspace } = useWorkspace();
  const { getLabelById } = useWorkspaceProjectLabels();

  // derived values
  const selectedGroupKey = filters?.display_filters?.group_by;

  const details = groupDetails({
    getProjectStateById,
    getProjectStatedByStateGroupKey,
    getWorkspaceMemberDetails,
    groupByKey,
    currentWorkspace,
    selectedGroupKey,
    getLabelById,
  });

  return (
    <>
      <CreateProjectModal
        isOpen={open}
        onClose={() => setOpen(false)}
        workspaceSlug={workspaceSlug.toString()}
        data={details?.prePopulatedPayload}
      />
      <div
        className={`relative flex shrink-0 gap-2  ${
          verticalAlign ? `flex-col items-center` : `w-full flex-row items-center`
        }`}
      >
        <div className="shrink-0 w-5 h-5 rounded-sm flex justify-center items-center overflow-hidden">
          {details?.icon}
        </div>

        <div
          className={`relative flex gap-1 ${
            verticalAlign ? `flex-col items-center` : `items-baseline w-full flex-row overflow-hidden`
          }`}
        >
          <div
            className={`line-clamp-1 inline-block overflow-hidden truncate font-medium text-primary ${
              verticalAlign ? `vertical-lr` : ``
            }`}
          >
            {details?.title}
          </div>
          <div
            className={`shrink-0 text-13 font-medium text-tertiary ${verticalAlign ? `text-center pr-0.5` : `pl-2`}`}
          >
            {projectIds?.length || 0}
          </div>
        </div>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => setVerticalAlign((state) => ({ ...state, [groupByKey]: !verticalAlign }))}
          icon={verticalAlign ? Maximize2 : Minimize2}
        />
        {permissions.canCreateProject && (
          <IconButton variant="ghost" size="sm" onClick={() => setOpen(true)} icon={PlusIcon} />
        )}
      </div>
    </>
  );
});
