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
import { observer } from "mobx-react";
// plane web components
import { ProjectPRStateMappingRoot } from "./pr-state-mapping";
import { ProjectIssueSyncRoot } from "./project-issue-sync";

interface IIntegrationRootProps {
  isEnterprise: boolean;
}

export const IntegrationRoot = observer(function IntegrationRoot({ isEnterprise }: IIntegrationRootProps) {
  return (
    <div className="relative space-y-4">
      <ProjectPRStateMappingRoot isEnterprise={isEnterprise} />
      <ProjectIssueSyncRoot isEnterprise={isEnterprise} />
    </div>
  );
});
