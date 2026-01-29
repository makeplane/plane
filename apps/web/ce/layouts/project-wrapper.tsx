/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// layouts
import { ProjectAuthWrapper as CoreProjectAuthWrapper } from "@/layouts/auth-layout/project-wrapper";

export type IProjectAuthWrapper = {
  workspaceSlug: string;
  projectId: string;
  children: React.ReactNode;
};

export const ProjectAuthWrapper = observer(function ProjectAuthWrapper(props: IProjectAuthWrapper) {
  // props
  const { workspaceSlug, projectId, children } = props;

  return (
    <CoreProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
      {children}
    </CoreProjectAuthWrapper>
  );
});
