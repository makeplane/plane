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
import { useParams } from "next/navigation";
import { BriefcaseIcon } from "lucide-react";
// components
import { UpdateTeamspaceProjectsButton } from "@/components/teamspaces/actions/projects/button";

type TAddProjectsToTeamProps = {
  isEditingAllowed: boolean;
};

export const AddProjectsToTeam = observer(function AddProjectsToTeam(props: TAddProjectsToTeamProps) {
  const { isEditingAllowed } = props;
  // router
  const { teamspaceId } = useParams();

  if (!teamspaceId) return <></>;
  return (
    <div className="flex flex-col gap-2 mx-4">
      <span className="text-body-xs-semibold text-tertiary">Get started</span>
      <div className="flex flex-col items-center justify-center text-center gap-2 px-4 py-10 border border-subtle-1 rounded-lg">
        <span className="flex flex-shrink-0 items-center justify-center size-10 rounded-sm bg-layer-1 my-1">
          <BriefcaseIcon className="size-6 text-tertiary" />
        </span>
        <p className="flex flex-col gap-0.5">
          <span className="text-body-xs-medium text-secondary">
            You haven&apos;t linked any projects to this teamspace yet.
          </span>
          <span className="text-caption-sm-regular text-tertiary">
            Click the button below to pick from a list of projects you can link.
          </span>
        </p>
        <UpdateTeamspaceProjectsButton
          variant="empty-state"
          teamspaceId={teamspaceId?.toString()}
          isEditingAllowed={isEditingAllowed}
        />
      </div>
    </div>
  );
});
