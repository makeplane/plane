"use client";

import type { FC } from "react";
// plane imports
import type { EProjectFeatureKey } from "@plane/constants";
// local components
import { ProjectBreadcrumb } from "./project";
import { ProjectFeatureBreadcrumb } from "./project-feature";

type TCommonProjectBreadcrumbProps = {
  workspaceSlug: string;
  projectId: string;
  featureKey?: EProjectFeatureKey;
  isLast?: boolean;
};

export const CommonProjectBreadcrumbs: FC<TCommonProjectBreadcrumbProps> = (props) => {
  const { workspaceSlug, projectId, featureKey, isLast = false } = props;
  return (
    <>
      <ProjectBreadcrumb workspaceSlug={workspaceSlug} projectId={projectId} />
      {featureKey && (
        <ProjectFeatureBreadcrumb
          workspaceSlug={workspaceSlug?.toString()}
          projectId={projectId?.toString()}
          featureKey={featureKey}
          isLast={isLast}
        />
      )}
    </>
  );
};
