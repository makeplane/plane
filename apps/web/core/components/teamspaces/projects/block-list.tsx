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
// types
import { TeamspaceProjectBlock } from "./block";

interface Props {
  projectIds: string[] | undefined;
  teamspaceId: string;
}

export function TeamspaceProjectBlocksList(props: Props) {
  const { projectIds = [], teamspaceId } = props;

  return (
    <div className="relative h-full w-full">
      {projectIds &&
        projectIds?.length > 0 &&
        projectIds.map((projectId: string) => (
          <TeamspaceProjectBlock key={projectId} projectId={projectId} teamspaceId={teamspaceId} />
        ))}
    </div>
  );
}
