import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";
// icons
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { CyclesIcon } from "components/icons";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// contexts
import { IssueViewContextProvider } from "contexts/issue-view.context";
// components
import { ExistingIssuesListModal, IssuesFilterView, IssuesView } from "components/core";
import { CycleDetailsSidebar } from "components/cycles";
// services
import issuesService from "services/issues.service";
import cycleServices from "services/cycles.service";
import projectService from "services/project.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { AnalyticsProjectModal } from "components/analytics";
// ui
import { CustomMenu, SecondaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// helpers
import { truncateText } from "helpers/string.helper";
import { getDateRangeStatus } from "helpers/date-time.helper";
// fetch-keys
import {
  CYCLE_ISSUES,
  CYCLES_LIST,
  PROJECT_DETAILS,
  CYCLE_DETAILS,
  PROJECT_ISSUES_LIST,
} from "constants/fetch-keys";

const SingleCycle: React.FC = () => {
  const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);
  const [cycleSidebar, setCycleSidebar] = useState(true);
  const [analyticsModal, setAnalyticsModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const { setToastAlert } = useToast();

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: cycles } = useSWR(
    workspaceSlug && projectId ? CYCLES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () =>
          cycleServices.getCyclesWithParams(workspaceSlug as string, projectId as string, {
            cycle_view: "all",
          })
      : null
  );

  const { data: cycleDetails } = useSWR(
    cycleId ? CYCLE_DETAILS(cycleId as string) : null,
    workspaceSlug && projectId && cycleId
      ? () =>
          cycleServices.getCycleDetails(
            workspaceSlug as string,
            projectId as string,
            cycleId as string
          )
      : null
  );

  const cycleStatus =
    cycleDetails?.start_date && cycleDetails?.end_date
      ? getDateRangeStatus(cycleDetails?.start_date, cycleDetails?.end_date)
      : "draft";

  const { data: issues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const openIssuesListModal = () => {
    setCycleIssuesListModal(true);
  };

  const handleAddIssuesToCycle = async (data: { issues: string[] }) => {
    if (!workspaceSlug || !projectId) return;

    await issuesService
      .addIssueToCycle(workspaceSlug as string, projectId as string, cycleId as string, data)
      .then(() => {
        mutate(CYCLE_ISSUES(cycleId as string));
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Selected issues could not be added to the cycle. Please try again.",
        });
      });
  };

  return (
    <IssueViewContextProvider>
      <ExistingIssuesListModal
        isOpen={cycleIssuesListModal}
        handleClose={() => setCycleIssuesListModal(false)}
        issues={issues?.filter((i) => !i.cycle_id) ?? []}
        handleOnSubmit={handleAddIssuesToCycle}
      />
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${activeProject?.name ?? "Project"} Cycles`}
              link={`/${workspaceSlug}/projects/${activeProject?.id}/cycles`}
            />
          </Breadcrumbs>
        }
        left={
          <CustomMenu
            label={
              <>
                <CyclesIcon className="h-3 w-3" />
                {cycleDetails?.name && truncateText(cycleDetails.name, 40)}
              </>
            }
            className="ml-1.5"
            width="auto"
          >
            {cycles?.map((cycle) => (
              <CustomMenu.MenuItem
                key={cycle.id}
                renderAs="a"
                href={`/${workspaceSlug}/projects/${activeProject?.id}/cycles/${cycle.id}`}
              >
                {truncateText(cycle.name, 40)}
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        }
        right={
          <div className={`flex items-center gap-2 duration-300`}>
            <IssuesFilterView />
            <SecondaryButton
              onClick={() => setAnalyticsModal(true)}
              className="!py-1.5 font-normal rounded-md text-brand-secondary"
              outline
            >
              Analytics
            </SecondaryButton>
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-brand-surface-1 ${
                cycleSidebar ? "rotate-180" : ""
              }`}
              onClick={() => setCycleSidebar((prevData) => !prevData)}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
          </div>
        }
      >
        <AnalyticsProjectModal isOpen={analyticsModal} onClose={() => setAnalyticsModal(false)} />
        <div
          className={`h-full ${cycleSidebar ? "mr-[24rem]" : ""} ${
            analyticsModal ? "mr-[50%]" : ""
          } duration-300`}
        >
          <IssuesView
            type="cycle"
            openIssuesListModal={openIssuesListModal}
            isCompleted={cycleStatus === "completed" ?? false}
          />
        </div>
        <CycleDetailsSidebar
          cycleStatus={cycleStatus}
          cycle={cycleDetails}
          isOpen={cycleSidebar}
          isCompleted={cycleStatus === "completed" ?? false}
        />
      </ProjectAuthorizationWrapper>
    </IssueViewContextProvider>
  );
};

export default SingleCycle;
