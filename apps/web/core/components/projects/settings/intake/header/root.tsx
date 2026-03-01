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

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { RefreshCcw } from "lucide-react";
import { IntakeIcon } from "@plane/propel/icons";
// plane imports
import { EUserPermissionsLevel, E_FEATURE_FLAGS } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { EUserProjectRoles } from "@plane/types";
import { Breadcrumbs, Header, Popover, Loader } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { InboxIssueCreateModalRoot } from "@/components/intake/modals/create-modal";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { ProjectBreadcrumbWithPreference } from "@/components/breadcrumbs/project/with-preference";
import { useFlag } from "@/plane-web/hooks/store";
// local imports
import IntakeTooltip from "../intake-tooltip";
import { IntakeHeaderQuickActions } from "./quick-actions";

export const ProjectInboxHeader = observer(function ProjectInboxHeader() {
  // router
  const { workspaceSlug, projectId: projectIdFromRouter, workItem } = useParams();
  // states
  const [createIssueModal, setCreateIssueModal] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { intakeForms, fetchIntakeForms } = useProjectInbox();
  const isEmailEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_EMAIL);
  const isFormEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_FORM);
  const isAdvancedIntakeEnabled = isEmailEnabled || isFormEnabled;
  const {
    getPartialProjectById,
    getProjectByIdentifier,
    loader: currentProjectDetailsLoader,
    isUpdatingProject,
  } = useProject();
  const { loader } = useProjectInbox();

  // derived values
  const [projectIdentifier] = workItem ? workItem?.toString()?.split("-") : [];
  const projectId = projectIdFromRouter
    ? projectIdFromRouter?.toString()
    : projectIdentifier
      ? getProjectByIdentifier(projectIdentifier)?.id
      : undefined;

  const currentProjectDetails = getPartialProjectById(projectId);

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

  if (!projectId) return null;

  const getCTA = () => {
    if (!isAdvancedIntakeEnabled) {
      return (
        <Button variant="primary" size="lg" onClick={() => setCreateIssueModal(true)}>
          Add work item
        </Button>
      );
    }
    if (intakeForms[projectId.toString()]) {
      return (
        <Button
          disabled={!intakeForms[projectId.toString()].is_in_app_enabled}
          variant="primary"
          size="lg"
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
            <ProjectBreadcrumbWithPreference
              workspaceSlug={workspaceSlug?.toString()}
              projectId={projectId?.toString()}
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Intake"
                  href={`/${workspaceSlug}/projects/${projectId}/intake/`}
                  icon={<IntakeIcon className="h-4 w-4 text-tertiary" />}
                  isLast
                />
              }
              isLast
            />
          </Breadcrumbs>

          {loader === "pagination-loading" && (
            <div className="flex items-center gap-1.5 text-tertiary">
              <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
              <p className="text-13">Syncing...</p>
            </div>
          )}
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <Popover
          buttonRefClassName="flex"
          popoverClassName="w-auto items-center flex"
          popoverButtonRef={popoverButtonRef}
          buttonClassName="my-auto outline-none text-tertiary"
          button={
            <Button variant="secondary" size="lg">
              Intake source
            </Button>
          }
          popperPosition="bottom-end"
          panelClassName="rounded-sm border-[0.5px] border-subtle-1 bg-surface-1 p-3 text-11 shadow-raised-200 focus:outline-none max-w-sm"
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
        <IntakeHeaderQuickActions workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
      </Header.RightItem>
    </Header>
  );
});
