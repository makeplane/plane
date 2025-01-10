"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { RefreshCcw } from "lucide-react";
// ui
import { Breadcrumbs, Button, Intake, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { InboxIssueCreateModalRoot } from "@/components/inbox";
// hooks
import { useProject, useProjectInbox, useUserPermissions } from "@/hooks/store";
// plane web
import { ProjectBreadcrumb } from "@/plane-web/components/breadcrumbs";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

export const ProjectInboxHeader: FC = observer(() => {
  // states
  const [createIssueModal, setCreateIssueModal] = useState(false);
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const { currentProjectDetails, loader: currentProjectDetailsLoader } = useProject();
  const { loader } = useProjectInbox();

  // derived value
  const isAuthorized = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-4">
          <Breadcrumbs isLoading={currentProjectDetailsLoader}>
            <ProjectBreadcrumb />

            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Intake" icon={<Intake className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>

          {loader === "pagination-loading" && (
            <div className="flex items-center gap-1.5 text-custom-text-300">
              <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
              <p className="text-sm">Syncing...</p>
            </div>
          )}
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        {currentProjectDetails?.inbox_view && workspaceSlug && projectId && isAuthorized ? (
          <div className="flex items-center gap-2">
            <InboxIssueCreateModalRoot
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              modalState={createIssueModal}
              handleModalClose={() => setCreateIssueModal(false)}
            />

            <Button variant="primary" size="sm" onClick={() => setCreateIssueModal(true)}>
              Add issue
            </Button>
          </div>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
