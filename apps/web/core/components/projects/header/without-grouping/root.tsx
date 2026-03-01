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
// i18n
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { Button } from "@plane/propel/button";
import { ProjectIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import HeaderFilters from "./filters";
import { ProjectSearch } from "./search-projects";

type TProjectsListWithoutGroupingHeaderProps = {
  workspaceSlug: string;
  isArchived: boolean;
};

export const ProjectsListWithoutGroupingHeader = observer(function ProjectsListWithoutGroupingHeader(
  props: TProjectsListWithoutGroupingHeaderProps
) {
  const { workspaceSlug, isArchived } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  // auth
  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug
  );

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={t("workspace_projects.label", { count: 2 })}
                icon={<ProjectIcon className="h-4 w-4 text-tertiary" />}
              />
            }
          />
          {isArchived && <Breadcrumbs.Item component={<BreadcrumbLink label="Archived" />} />}
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        <ProjectSearch />
        <div className="hidden md:flex">
          <HeaderFilters />
        </div>
        {isAuthorizedUser && !isArchived ? (
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              toggleCreateProjectModal(true);
            }}
            className="items-center gap-1"
          >
            <span className="hidden sm:inline-block">{t("workspace_projects.create.label")}</span>
            <span className="inline-block sm:hidden">{t("workspace_projects.label", { count: 1 })}</span>
          </Button>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
