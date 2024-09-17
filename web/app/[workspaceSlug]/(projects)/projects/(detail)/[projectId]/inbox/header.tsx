"use client";

import { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Info, RefreshCcw } from "lucide-react";
// ui
import { Breadcrumbs, Button, Intake, Header, Tooltip, Popover } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { InboxIssueCreateEditModalRoot } from "@/components/inbox";
// hooks
import { useProject, useProjectInbox, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import IntakeSubFeatures from "@/components/project/settings/intake-sub-features";
import IntakeTooltip from "./intake-tooltip";
import { cn } from "@plane/editor";

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
  // ref
  const popoverButtonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-1">
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
          <Popover
            buttonRefClassName="flex"
            popoverClassName="w-auto items-center flex"
            popoverButtonRef={popoverButtonRef}
            buttonClassName="my-auto outline-none text-custom-text-300"
            button={<Info size={15} />}
            popperPosition="bottom-end"
            panelClassName="rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 p-3 text-xs shadow-custom-shadow-rg focus:outline-none"
          >
            <IntakeTooltip />
          </Popover>
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
      </Header.RightItem>
    </Header>
  );
});
