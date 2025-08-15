"use client";

import { FC } from "react";
import useSWR from "swr";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
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

export const ProjectOverviewMainContentRoot: FC<Props> = (props) => {
  const { workspaceSlug, projectId, disabled } = props;
  // store hooks
  const { fetchAttachments } = useProjectAttachments();
  const { projectOverviewSidebarCollapsed } = useAppTheme();
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
      <div
        className={cn("flex flex-col h-full w-full px-10 py-8", {
          "max-w-2/3": !projectOverviewSidebarCollapsed,
        })}
      >
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
};
