/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EpicIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { EIssuesStoreType } from "@plane/types";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { CountChip } from "@/components/common/count-chip";
import { HeaderFilters } from "@/components/issues/filters";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
import { CreateUpdateEpicModal } from "@/plane-web/components/epics/epic-modal";

export const ProjectEpicsHeader = observer(function ProjectEpicsHeader() {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // states
  const [isCreateEpicModalOpen, setIsCreateEpicModalOpen] = useState(false);
  // store hooks
  const {
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.EPIC);
  // i18n
  const { t } = useTranslation();

  const { currentProjectDetails, loader } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { isMobile } = usePlatformOS();

  const epicsCount = getGroupIssueCount(undefined, undefined, false);
  const canUserCreateEpic = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2.5">
          <Breadcrumbs onBack={() => router.back()} isLoading={loader === "init-loader"} className="flex-grow-0">
            <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={t("sidebar.epics")}
                  href={`/${workspaceSlug}/projects/${projectId}/epics/`}
                  icon={<EpicIcon className="h-4 w-4 text-tertiary" />}
                  isLast
                />
              }
              isLast
            />
          </Breadcrumbs>
          {epicsCount && epicsCount > 0 ? (
            <Tooltip
              isMobile={isMobile}
              tooltipContent={t("epic.count_tooltip", { count: epicsCount })}
              position="bottom"
            >
              <CountChip count={epicsCount} />
            </Tooltip>
          ) : null}
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <div className="hidden gap-2 md:flex">
          <HeaderFilters
            projectId={projectId?.toString()}
            currentProjectDetails={currentProjectDetails}
            workspaceSlug={workspaceSlug?.toString()}
            canUserCreateIssue={canUserCreateEpic}
            storeType={EIssuesStoreType.EPIC}
          />
        </div>
        {canUserCreateEpic && (
          <>
            <CreateUpdateEpicModal
              isOpen={isCreateEpicModalOpen}
              onClose={() => setIsCreateEpicModalOpen(false)}
              data={{ project_id: projectId?.toString() }}
            />
            <Button variant="primary" size="lg" onClick={() => setIsCreateEpicModalOpen(true)}>
              <div className="block sm:hidden">{t("epic.label", { count: 1 })}</div>
              <div className="hidden sm:block">{t("epic.new")}</div>
            </Button>
          </>
        )}
      </Header.RightItem>
    </Header>
  );
});
