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
import { useParams } from "next/navigation";
// ui
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CycleIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { CyclesViewHeader } from "@/components/cycles/cycles-view-header";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { ProjectBreadcrumbWithPreference } from "@/components/breadcrumbs/project/with-preference";

export const CyclesListHeader = observer(function CyclesListHeader() {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();

  // store hooks
  const { toggleCreateCycleModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails, loader } = useProject();
  const { t } = useTranslation();

  const canUserCreateCycle = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
          <ProjectBreadcrumbWithPreference
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label="Cycles"
                href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/cycles/`}
                icon={<CycleIcon className="h-4 w-4 text-tertiary" />}
                isLast
              />
            }
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
      {canUserCreateCycle && currentProjectDetails ? (
        <Header.RightItem>
          <CyclesViewHeader projectId={currentProjectDetails.id} />
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              toggleCreateCycleModal(true);
            }}
            data-tour="cycle-tour-step-1"
          >
            <div className="sm:hidden block">{t("add")}</div>
            <div className="hidden sm:block">{t("project_cycles.add_cycle")}</div>
          </Button>
        </Header.RightItem>
      ) : (
        <></>
      )}
    </Header>
  );
});
