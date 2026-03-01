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

import useSWR from "swr";
// hooks
import { useProjectAttachments } from "@/plane-web/hooks/store/projects/use-project-attachments";
// local components
import { ProjectOverviewCollapsibleSectionRoot } from "./collapsible-section-root";
import { useLinks } from "./collaspible-section/links/use-links";
import { ProjectOverviewInfoSectionRoot } from "./info-section-root";
import { ProjectOverviewModalRoot } from "./modal-root";
import { ProjectOverviewProgressSectionRoot } from "./progress-section-root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  disabled: boolean;
};

export function ProjectOverviewMainContentRoot(props: Props) {
  const { workspaceSlug, projectId, disabled } = props;
  // store hooks
  const { fetchAttachments } = useProjectAttachments();
  // helper hooks
  const { fetchLinks } = useLinks(workspaceSlug.toString(), projectId.toString());

  useSWR(
    projectId && workspaceSlug ? `PROJECT_LINKS_${projectId}` : null,
    projectId && workspaceSlug ? () => fetchLinks(workspaceSlug.toString(), projectId.toString()) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  useSWR(
    projectId && workspaceSlug ? `PROJECT_ATTACHMENTS_${projectId}` : null,
    projectId && workspaceSlug ? () => fetchAttachments(workspaceSlug.toString(), projectId.toString()) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return (
    <div className="h-full w-full flex flex-col overflow-y-auto">
      <ProjectOverviewInfoSectionRoot workspaceSlug={workspaceSlug} projectId={projectId} />
      <div className="flex flex-col h-full w-full px-10 py-8">
        <ProjectOverviewProgressSectionRoot workspaceSlug={workspaceSlug} projectId={projectId} />
        <ProjectOverviewCollapsibleSectionRoot
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          disabled={disabled}
        />
        <ProjectOverviewModalRoot workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>
    </div>
  );
}
