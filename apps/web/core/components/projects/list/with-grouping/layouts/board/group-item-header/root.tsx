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

import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Maximize2, Minimize2 } from "lucide-react";
import { PlusIcon } from "@plane/propel/icons";
// components
import { CreateProjectModal } from "@/components/projects/modals/create-project-modal";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useProjectFilter, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
// local imports
import { groupDetails } from "../utils";

type TProjectBoardGroupItemHeader = {
  groupByKey: string;
  projectIds: string[];
  verticalAlign: boolean;
  setVerticalAlign: (
    value: (state: { [key: string]: boolean }) => {
      [key: string]: boolean;
    }
  ) => void;
};

export const ProjectBoardGroupItemHeader = observer(function ProjectBoardGroupItemHeader(
  props: TProjectBoardGroupItemHeader
) {
  const { groupByKey, projectIds, verticalAlign, setVerticalAlign } = props;
  //states
  const [open, setOpen] = useState(false);
  // hooks
  const { filters } = useProjectFilter();
  const { getProjectStateById, getProjectStatedByStateGroupKey } = useWorkspaceProjectStates();
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();
  const { workspaceSlug } = useParams();
  const { currentWorkspace } = useWorkspace();

  // derived values
  const selectedGroupKey = filters?.display_filters?.group_by;

  const details = groupDetails(
    getProjectStateById,
    getProjectStatedByStateGroupKey,
    getWorkspaceMemberDetails,
    groupByKey,
    currentWorkspace,
    selectedGroupKey
  );

  return (
    <>
      <CreateProjectModal
        isOpen={open}
        onClose={() => setOpen(false)}
        workspaceSlug={workspaceSlug.toString()}
        data={details?.prePopulatedPayload}
      />
      <div
        className={`relative flex flex-shrink-0 gap-2  ${
          verticalAlign ? `w-[44px] flex-col items-center` : `w-full flex-row items-center`
        }`}
      >
        <div className="flex-shrink-0 w-5 h-5 rounded-sm flex justify-center items-center overflow-hidden">
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
            className={`flex-shrink-0 text-13 font-medium text-tertiary ${verticalAlign ? `text-center pr-0.5` : `pl-2`}`}
          >
            {projectIds?.length || 0}
          </div>
        </div>

        <div
          className="flex h-[20px] w-[20px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-all hover:bg-layer-1"
          onClick={() => setVerticalAlign((state) => ({ ...state, [groupByKey]: !verticalAlign }))}
        >
          {verticalAlign ? <Maximize2 width={12} strokeWidth={2} /> : <Minimize2 width={12} strokeWidth={2} />}
        </div>
        <div
          onClick={() => setOpen(true)}
          className="cursor-pointer flex-shrink-0 w-5 h-5 rounded-sm hover:bg-layer-1 flex justify-center items-center overflow-hidden bg-layer-1"
        >
          <PlusIcon width={14} height={14} />
        </div>
      </div>
    </>
  );
});
