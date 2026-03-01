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

// local components
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";
import { ProjectBreadcrumb } from "./root";

type TCommonProjectBreadcrumbProps = {
  workspaceSlug: string;
  projectId: string;
};

export function ProjectBreadcrumbWithPreference(props: TCommonProjectBreadcrumbProps) {
  const { workspaceSlug, projectId } = props;
  // preferences
  const { preferences: projectPreferences } = useProjectNavigationPreferences();

  if (projectPreferences.navigationMode === "TABBED") return null;
  return <ProjectBreadcrumb workspaceSlug={workspaceSlug} projectId={projectId} />;
}
