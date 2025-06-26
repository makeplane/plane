"use client";

import { FC } from "react";
// plane imports
import { EProjectFeatureKey } from "@plane/constants";
// local components
import { ProjectFeatureBreadcrumb } from "./project-feature";
import { ProjectBreadcrumb } from "./project";

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
