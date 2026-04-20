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
import type { IWorkspace } from "@plane/types";
// local imports
import { WorkspaceNotAuthorizedPage } from "./not-authorized";
import { WorkspaceNotFoundPage } from "./not-found";

type Props = {
  errorStatusCode: number | undefined;
  allWorkspaces: IWorkspace[] | undefined;
};

export const WorkspaceAccessRestriction = observer(function WorkspaceAccessRestriction(props: Props) {
  const { errorStatusCode, allWorkspaces } = props;

  // 403 Forbidden — user is not authorized to access this workspace
  if (errorStatusCode === 403) {
    return <WorkspaceNotAuthorizedPage />;
  }

  // 404 Not Found or any other error — workspace does not exist
  return <WorkspaceNotFoundPage allWorkspaces={allWorkspaces} />;
});
