import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import useSWR from "swr";
// icons
import { ArrowLeft } from "lucide-react";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// contexts
import { IssueViewContextProvider } from "contexts/issue-view.context";
// components
import { ExistingIssuesListModal } from "components/core";
import { CycleDetailsSidebar, TransferIssues, TransferIssuesModal } from "components/cycles";
import { CycleLayoutRoot } from "components/issues/issue-layouts";
// services
import { IssueService } from "services/issue";
import { CycleService } from "services/cycle.service";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// ui
import { BreadcrumbItem, Breadcrumbs, ContrastIcon } from "@plane/ui";
import { CustomMenu } from "components/ui";
import { EmptyState } from "components/common";
// images
import emptyCycle from "public/empty-state/cycle.svg";
// helpers
import { truncateText } from "helpers/string.helper";
import { getDateRangeStatus } from "helpers/date-time.helper";
// types
import { ISearchIssueResponse } from "types";
// fetch-keys
import { CYCLES_LIST, CYCLE_DETAILS } from "constants/fetch-keys";
import { CycleIssuesHeader } from "components/headers";

// services
const issueService = new IssueService();
const cycleService = new CycleService();

const SingleCycle: React.FC = () => {
  const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);
  const [cycleSidebar, setCycleSidebar] = useState(true);
  const [analyticsModal, setAnalyticsModal] = useState(false);
  const [transferIssuesModal, setTransferIssuesModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const { user } = useUserAuth();

  const { setToastAlert } = useToast();

  const { data: cycles } = useSWR(
    workspaceSlug && projectId ? CYCLES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => cycleService.getCyclesWithParams(workspaceSlug as string, projectId as string, "all")
      : null
  );

  const { data: cycleDetails, error } = useSWR(
    workspaceSlug && projectId && cycleId ? CYCLE_DETAILS(cycleId.toString()) : null,
    workspaceSlug && projectId && cycleId
      ? () => cycleService.getCycleDetails(workspaceSlug.toString(), projectId.toString(), cycleId.toString())
      : null
  );

  const cycleStatus =
    cycleDetails?.start_date && cycleDetails?.end_date
      ? getDateRangeStatus(cycleDetails?.start_date, cycleDetails?.end_date)
      : "draft";

  const handleAddIssuesToCycle = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId) return;

    const payload = {
      issues: data.map((i) => i.id),
    };

    await issueService
      .addIssueToCycle(workspaceSlug as string, projectId as string, cycleId as string, payload, user)
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
        searchParams={{ cycle: true }}
        handleOnSubmit={handleAddIssuesToCycle}
      />
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs onBack={() => router.back()}>
            <Breadcrumbs.BreadcrumbItem
              link={
                <Link href={`/${workspaceSlug}/projects/${projectId}/cycles`}>
                  <a className={`border-r-2 border-custom-sidebar-border-200 px-3 text-sm `}>
                    <p className="truncate">{`${truncateText(
                      cycleDetails?.project_detail.name ?? "Project",
                      32
                    )} Cycles`}</p>
                  </a>
                </Link>
              }
            />
          </Breadcrumbs>
        }
        left={
          <CustomMenu
            label={
              <>
                <ContrastIcon className="h-3 w-3" />
                {cycleDetails?.name && truncateText(cycleDetails.name, 40)}
              </>
            }
            className="ml-1.5 flex-shrink-0"
            width="auto"
          >
            {cycles?.map((cycle) => (
              <CustomMenu.MenuItem
                key={cycle.id}
                renderAs="a"
                href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}`}
              >
                {truncateText(cycle.name, 40)}
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        }
        right={
          <div className={`flex flex-shrink-0 items-center gap-2 duration-300`}>
            <CycleIssuesHeader />
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-90 ${
                cycleSidebar ? "rotate-180" : ""
              }`}
              onClick={() => setCycleSidebar((prevData) => !prevData)}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        }
      >
        {error ? (
          <EmptyState
            image={emptyCycle}
            title="Cycle does not exist"
            description="The cycle you are looking for does not exist or has been deleted."
            primaryButton={{
              text: "View other cycles",
              onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/cycles`),
            }}
          />
        ) : (
          <>
            <TransferIssuesModal handleClose={() => setTransferIssuesModal(false)} isOpen={transferIssuesModal} />

            <div
              className={`relative w-full h-full flex flex-col overflow-auto ${cycleSidebar ? "mr-[24rem]" : ""} ${
                analyticsModal ? "mr-[50%]" : ""
              } duration-300`}
            >
              {cycleStatus === "completed" && <TransferIssues handleClick={() => setTransferIssuesModal(true)} />}

              <CycleLayoutRoot />
            </div>
            <CycleDetailsSidebar
              cycleStatus={cycleStatus}
              cycle={cycleDetails}
              isOpen={cycleSidebar}
              isCompleted={cycleStatus === "completed" ?? false}
              user={user}
            />
          </>
        )}
      </ProjectAuthorizationWrapper>
    </IssueViewContextProvider>
  );
};

export default SingleCycle;
