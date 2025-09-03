"use client";

import { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { RefreshCcw } from "lucide-react";
// plane imports
import { EProjectFeatureKey, EUserPermissionsLevel, E_FEATURE_FLAGS } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
import { Breadcrumbs, Button, Header, Popover, Loader } from "@plane/ui";
// components
import { InboxIssueCreateModalRoot } from "@/components/inbox/modals/create-modal";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useUserPermissions } from "@/hooks/store/user";
// plane web
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
// local components
import { useFlag } from "@/plane-web/hooks/store";
import IntakeTooltip from "../intake-tooltip";

export const ProjectInboxHeader: FC = observer(() => {
  // states
  const [createIssueModal, setCreateIssueModal] = useState(false);
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { intakeForms, fetchIntakeForms } = useProjectInbox();
  const isEmailEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_EMAIL);
  const isFormEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_FORM);
  const isAdvancedIntakeEnabled = isEmailEnabled || isFormEnabled;
  const { currentProjectDetails, loader: currentProjectDetailsLoader, isUpdatingProject } = useProject();
  const { loader } = useProjectInbox();

  // fetching intake forms
  useSWR(
    workspaceSlug && projectId && !isUpdatingProject && isAdvancedIntakeEnabled
      ? `INTAKE_FORMS_${workspaceSlug}_${projectId}`
      : null,
    workspaceSlug && projectId && !isUpdatingProject && isAdvancedIntakeEnabled
      ? () => fetchIntakeForms(workspaceSlug.toString(), projectId.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // derived value
  const isAuthorized = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER, EUserProjectRoles.GUEST],
    EUserPermissionsLevel.PROJECT
  );
  // ref
  const popoverButtonRef = useRef<HTMLButtonElement | null>(null);

  const getCTA = () => {
    if (!isAdvancedIntakeEnabled) {
      return (
        <Button variant="primary" size="sm" onClick={() => setCreateIssueModal(true)}>
          Add work item
        </Button>
      );
    }
    if (intakeForms[projectId.toString()]) {
      return (
        <Button
          disabled={!intakeForms[projectId.toString()].is_in_app_enabled}
          variant="primary"
          size="sm"
          onClick={() => setCreateIssueModal(true)}
        >
          Add work item
        </Button>
      );
    } else {
      return (
        <Loader>
          <Loader.Item width="72px" height="26px" />
        </Loader>
      );
    }
  };
  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-1">
          <Breadcrumbs isLoading={currentProjectDetailsLoader === "init-loader"}>
            <CommonProjectBreadcrumbs
              workspaceSlug={workspaceSlug?.toString()}
              projectId={currentProjectDetails?.id?.toString() ?? ""}
              featureKey={EProjectFeatureKey.INTAKE}
              isLast
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
        <Popover
          buttonRefClassName="flex"
          popoverClassName="w-auto items-center flex"
          popoverButtonRef={popoverButtonRef}
          buttonClassName="my-auto outline-none text-custom-text-300"
          button={
            <Button
              variant="neutral-primary"
              size="sm"
              className="my-auto outline-none text-custom-text-200 font-medium"
            >
              Intake source
            </Button>
          }
          popperPosition="bottom-end"
          panelClassName="rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 p-3 text-xs shadow-custom-shadow-rg focus:outline-none max-w-sm"
        >
          <IntakeTooltip projectId={projectId.toString()} />
        </Popover>
        {currentProjectDetails?.inbox_view && workspaceSlug && projectId && isAuthorized ? (
          <div className="flex items-center gap-2">
            <InboxIssueCreateModalRoot
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              modalState={createIssueModal}
              handleModalClose={() => setCreateIssueModal(false)}
            />

            {getCTA()}
          </div>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
