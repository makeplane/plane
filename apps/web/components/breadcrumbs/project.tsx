/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ProjectsOutline } from "@makeplane/propel/icons";
// plane imports
import type { BreadcrumbNavigationItem, TCrumbLabelProps } from "@plane/blocks/breadcrumb";
import { Breadcrumbs, BreadcrumbNavigationSelect } from "@plane/blocks/breadcrumb";
import { Logo } from "@plane/blocks/emoji-icon-picker";
import { useTranslation } from "@plane/i18n";
import { SwitcherLabel } from "@/components/common/switcher-label";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";

type TProjectBreadcrumbProps = {
  workspaceSlug: string;
  projectId: string;
  handleOnClick?: () => void;
} & TCrumbLabelProps;

export const ProjectBreadcrumb = observer(function ProjectBreadcrumb(props: TProjectBreadcrumbProps) {
  const { workspaceSlug, projectId, handleOnClick, ...crumbProps } = props;
  // plane hooks
  const { t } = useTranslation();
  // router
  const router = useAppRouter();
  // store hooks
  const { joinedProjectIds, getPartialProjectById } = useProject();
  const currentProjectDetails = getPartialProjectById(projectId);

  if (!currentProjectDetails) return null;

  // derived values
  const switcherOptions = joinedProjectIds
    .map<BreadcrumbNavigationItem | undefined>((id) => {
      const project = getPartialProjectById(id);
      if (!project) return undefined;
      return {
        key: id,
        label: project.name,
        content: (
          <SwitcherLabel
            name={project.name}
            logo_props={project.logo_props}
            LabelIcon={ProjectsOutline}
            type="material"
          />
        ),
      };
    })
    .filter((option) => option !== undefined);

  return (
    <Breadcrumbs.Item
      // The crumb's name is behind `BreadcrumbNavigationSelect`, deeper than the collapsed-crumb
      // extractor's depth cap, so name it explicitly.
      showSeparator={false}
      label={currentProjectDetails.name}
      {...crumbProps}
      component={
        <BreadcrumbNavigationSelect
          selectedItemKey={currentProjectDetails.id}
          navigationItems={switcherOptions}
          onChange={(value: string) => {
            router.push(`/${workspaceSlug}/projects/${value}/issues`);
          }}
          label={currentProjectDetails.name}
          icon={<Logo logo={currentProjectDetails.logo_props} size={14} />}
          handleOnClick={() => {
            if (handleOnClick) handleOnClick();
            else router.push(`/${workspaceSlug}/projects/${currentProjectDetails.id}/issues/`);
          }}
          placeholder={t("common.project")}
          searchPlaceholder={t("common.search.label")}
          emptyMessage={t("common.search.no_matches_found")}
        />
      }
    />
  );
});
