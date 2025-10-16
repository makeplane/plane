"use client";

import type { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { EProjectFeatureKey } from "@plane/constants";
import type { ISvgIcons } from "@plane/propel/icons";
import { BreadcrumbNavigationDropdown, Breadcrumbs } from "@plane/ui";
// components
import { SwitcherLabel } from "@/components/common/switcher-label";
import type { TNavigationItem } from "@/components/workspace/sidebar/project-navigation";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { getProjectFeatureNavigation } from "../projects/navigation/helper";

type TProjectFeatureBreadcrumbProps = {
  workspaceSlug: string;
  projectId: string;
  featureKey: EProjectFeatureKey;
  isLast?: boolean;
  additionalNavigationItems?: TNavigationItem[];
};

export const ProjectFeatureBreadcrumb = observer((props: TProjectFeatureBreadcrumbProps) => {
  const { workspaceSlug, projectId, featureKey, isLast = false, additionalNavigationItems } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const { getPartialProjectById } = useProject();
  // derived values
  const project = getPartialProjectById(projectId);

  if (!project) return null;

  const navigationItems = getProjectFeatureNavigation(workspaceSlug, projectId, project);

  // if additional navigation items are provided, add them to the navigation items
  const allNavigationItems = [...(additionalNavigationItems || []), ...navigationItems];

  return (
    <>
      <Breadcrumbs.Item
        component={
          <BreadcrumbNavigationDropdown
            selectedItemKey={featureKey}
            navigationItems={allNavigationItems
              .filter((item) => item.shouldRender)
              .map((item) => ({
                key: item.key,
                title: item.name,
                customContent: <SwitcherLabel name={item.name} LabelIcon={item.icon as FC<ISvgIcons>} />,
                action: () => router.push(item.href),
                icon: item.icon as FC<ISvgIcons>,
              }))}
            handleOnClick={() => {
              router.push(
                `/${workspaceSlug}/projects/${projectId}/${featureKey === EProjectFeatureKey.WORK_ITEMS ? "issues" : featureKey}/`
              );
            }}
            isLast={isLast}
          />
        }
        showSeparator={false}
        isLast={isLast}
      />
    </>
  );
});
