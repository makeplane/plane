/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TCrumbLabelProps } from "@plane/blocks/breadcrumb";
// local components
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";
import { ProjectBreadcrumb } from "./project";

type TCommonProjectBreadcrumbProps = {
  workspaceSlug: string;
  projectId: string;
} & TCrumbLabelProps;

export function CommonProjectBreadcrumbs(props: TCommonProjectBreadcrumbProps) {
  const { workspaceSlug, projectId, ...crumbProps } = props;
  // preferences
  const { preferences: projectPreferences } = useProjectNavigationPreferences();

  if (projectPreferences.navigationMode === "TABBED") return null;
  return <ProjectBreadcrumb workspaceSlug={workspaceSlug} projectId={projectId} {...crumbProps} />;
}
