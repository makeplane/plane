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
import { usePathname } from "next/navigation";
// plane imports
import { E_FEATURE_FLAGS, PROJECT_SETTINGS } from "@plane/constants";
// components
import { getProjectActivePath } from "@/components/settings/helper";
import { ProjectMembersActivitySidebar } from "@/components/projects/settings/members/sidebar";
// hooks
import { useFlag } from "@/plane-web/hooks/store";

type TProjectRightSidebarProps = { workspaceSlug: string; projectId: string };

export const ProjectRightSidebar = observer(function ProjectRightSidebar(props: TProjectRightSidebarProps) {
  const { workspaceSlug, projectId } = props;
  // next hooks
  const pathname = usePathname();
  // store hooks
  const isProjectMembersActivityEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.PROJECT_MEMBER_ACTIVITY);

  return (
    <>
      {/* Project members activity sidebar */}
      {projectId &&
        getProjectActivePath(pathname) === PROJECT_SETTINGS["members"]["i18n_label"] &&
        isProjectMembersActivityEnabled && (
          <div className="block">
            <ProjectMembersActivitySidebar workspaceSlug={workspaceSlug} projectId={projectId} />
          </div>
        )}
    </>
  );
});
