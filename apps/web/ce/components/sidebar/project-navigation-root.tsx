/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
// components
import { ProjectNavigation } from "@/components/workspace/sidebar/project-navigation";

type TProjectItemsRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export function ProjectNavigationRoot(props: TProjectItemsRootProps) {
  const { workspaceSlug, projectId } = props;
  return <ProjectNavigation workspaceSlug={workspaceSlug} projectId={projectId} />;
}
