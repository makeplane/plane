"use client";

import { observer } from "mobx-react";
// ui
import { RssIcon } from "lucide-react";
import { EProjectFeatureKey, EUserProjectRoles } from "@plane/constants";
import { EpicIcon } from "@plane/ui";
// components
import { ProjectFeatureBreadcrumb as CEProjectFeatureBreadcrumb } from "@/ce/components/breadcrumbs";
// hooks
import { useProject } from "@/hooks/store";
import { useFlag } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";

type TProjectFeatureBreadcrumbProps = {
  workspaceSlug: string;
  projectId: string;
  featureKey: EProjectFeatureKey;
  isLast?: boolean;
};

export const ProjectFeatureBreadcrumb = observer((props: TProjectFeatureBreadcrumbProps) => {
  const { workspaceSlug, projectId, featureKey, isLast = false } = props;
  // store hooks
  const { getPartialProjectById } = useProject();
  const { getProjectFeatures } = useProjectAdvanced();
  const isProjectOverviewEnabled = useFlag(workspaceSlug, "PROJECT_OVERVIEW");

  // derived values
  const project = getPartialProjectById(projectId);
  const projectFeatures = getProjectFeatures(projectId);
  const isEpicsEnabled = projectFeatures?.is_epic_enabled;

  if (!project) return null;

  const additionalNavigationItems = [
    {
      name: "Overview",
      key: EProjectFeatureKey.OVERVIEW,
      href: `/${workspaceSlug}/projects/${projectId}/overview/`,
      icon: RssIcon,
      access: [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
      shouldRender: !!isProjectOverviewEnabled,
      sortOrder: -2,
      i18n_key: "common.overview",
    },
    {
      name: "Epics",
      key: EProjectFeatureKey.EPICS,
      href: `/${workspaceSlug}/projects/${projectId}/epics`,
      icon: EpicIcon,
      access: [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
      shouldRender: !!isEpicsEnabled,
      sortOrder: -1,
      i18n_key: "sidebar.epics",
    },
  ];

  return (
    <CEProjectFeatureBreadcrumb
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      featureKey={featureKey}
      isLast={isLast}
      additionalNavigationItems={additionalNavigationItems}
    />
  );
});
