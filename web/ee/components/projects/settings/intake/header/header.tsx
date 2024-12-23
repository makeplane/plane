"use client";

import { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Info, RefreshCcw } from "lucide-react";
// ui
import { Breadcrumbs, Button, Intake, Header, Popover, Loader } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
// hooks
import { InboxIssueCreateModalRoot } from "@/components/inbox";
import { useProject, useProjectInbox, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import IntakeTooltip from "../intake-tooltip";

export const IntakeHeader: FC = observer(() => {
  // states
  const [createIssueModal, setCreateIssueModal] = useState(false);
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { intakeForms, fetchIntakeForms } = useProjectInbox();

  const { currentProjectDetails, loader: currentProjectDetailsLoader, isUpdatingProject } = useProject();
  const { loader } = useProjectInbox();

  // fetching intake forms
  useSWR(
    workspaceSlug && projectId && !isUpdatingProject ? `INTAKE_FORMS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId && !isUpdatingProject
      ? () => fetchIntakeForms(workspaceSlug.toString(), projectId.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
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
            button={<Info size={15} className="my-auto" />}
            popperPosition="bottom-end"
            panelClassName="rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 p-3 text-xs shadow-custom-shadow-rg focus:outline-none"
          >
            <IntakeTooltip projectId={projectId.toString()} />
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
            <InboxIssueCreateModalRoot
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              modalState={createIssueModal}
              handleModalClose={() => setCreateIssueModal(false)}
            />
            {intakeForms[projectId.toString()] ? (
              <Button
                disabled={!intakeForms[projectId.toString()].is_in_app_enabled}
                variant="primary"
                size="sm"
                onClick={() => setCreateIssueModal(true)}
              >
                Add issue
              </Button>
            ) : (
              <Loader>
                <Loader.Item width="72px" height="26px" />
              </Loader>
            )}
          </div>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
