"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { RefreshCcw } from "lucide-react";
// ui
import { Breadcrumbs, Button, Intake, CustomHeader } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { InboxIssueCreateEditModalRoot } from "@/components/inbox";
// constants
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useProject, useProjectInbox, useUser } from "@/hooks/store";

export const ProjectInboxHeader: FC = observer(() => {
  // states
  const [createIssueModal, setCreateIssueModal] = useState(false);
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails, loader: currentProjectDetailsLoader } = useProject();
  const { loader } = useProjectInbox();

  // derived value
  const isViewer = currentProjectRole === EUserProjectRoles.VIEWER;

  return (
    <CustomHeader>
      <CustomHeader.LeftItem>
        <div className="flex items-center gap-4">
          <Breadcrumbs isLoading={currentProjectDetailsLoader}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects`}
                  label={currentProjectDetails?.name ?? "Project"}
                  icon={
                    currentProjectDetails && (
                      <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                        <Logo logo={currentProjectDetails?.logo_props} size={16} />
                      </span>
                    )
                  }
                />
              }
            />

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
      </CustomHeader.LeftItem>
      <CustomHeader.RightItem>
        {currentProjectDetails?.inbox_view && workspaceSlug && projectId && !isViewer ? (
          <div className="flex items-center gap-2">
            <InboxIssueCreateEditModalRoot
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              modalState={createIssueModal}
              handleModalClose={() => setCreateIssueModal(false)}
              issue={undefined}
            />

            <Button variant="primary" size="sm" onClick={() => setCreateIssueModal(true)}>
              Add issue
            </Button>
          </div>
        ) : (
          <></>
        )}
      </CustomHeader.RightItem>
    </CustomHeader>
  );
});
