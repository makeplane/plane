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
// plane imports
import { ArchiveIcon, InitiativeIcon, ProjectIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

type TProps = {
  activeTab: "projects" | "initiatives";
  workspaceSlug: string;
};

const WORKSPACE_ARCHIVES_BREADCRUMB_LIST: {
  [key: string]: {
    label: string;
    href: string;
    icon: React.FC<React.SVGAttributes<SVGElement> & { className?: string }>;
  };
} = {
  projects: {
    label: "Projects",
    href: "/projects",
    icon: ProjectIcon,
  },
  initiatives: {
    label: "Initiatives",
    href: "/initiatives",
    icon: InitiativeIcon,
  },
};

export const WorkspaceArchivesHeader = observer(function WorkspaceArchivesHeader(props: TProps) {
  const { activeTab, workspaceSlug } = props;
  // router
  const router = useAppRouter();

  const activeTabBreadcrumbDetail = WORKSPACE_ARCHIVES_BREADCRUMB_LIST[activeTab];

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2.5">
          <Breadcrumbs onBack={router.back}>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/archives/projects`}
                  label="Archives"
                  icon={<ArchiveIcon className="h-4 w-4 text-tertiary" />}
                />
              }
            />
            {activeTabBreadcrumbDetail && (
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink
                    label={activeTabBreadcrumbDetail.label}
                    icon={<activeTabBreadcrumbDetail.icon className="h-4 w-4 text-tertiary" />}
                  />
                }
              />
            )}
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
    </Header>
  );
});
