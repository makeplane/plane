import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// lib
import { requiredAdmin, requiredAuth } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// contexts
import { IssueViewContextProvider } from "contexts/issue-view.context";
// icons
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ListBulletIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
// components
import CyclesListView from "components/project/cycles/list-view";
import CyclesBoardView from "components/project/cycles/board-view";
import { CreateUpdateIssueModal } from "components/issues";
import ConfirmIssueDeletion from "components/project/issues/confirm-issue-deletion";
import ExistingIssuesListModal from "components/common/existing-issues-list-modal";
import CycleDetailSidebar from "components/project/cycles/cycle-detail-sidebar";
import View from "components/core/view";
// services
import issuesServices from "services/issues.service";
import cycleServices from "services/cycles.service";
import projectService from "services/project.service";
// ui
import { CustomMenu, EmptySpace, EmptySpaceItem, Spinner } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
// types
import { CycleIssueResponse, IIssue, SelectIssue, UserAuth } from "types";
import { NextPageContext } from "next";
// fetch-keys
import {
  CYCLE_ISSUES,
  CYCLE_LIST,
  PROJECT_ISSUES_LIST,
  PROJECT_MEMBERS,
  PROJECT_DETAILS,
} from "constants/fetch-keys";

const SingleCycle: React.FC<UserAuth> = (props) => {
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<SelectIssue>();
  const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);
  const [deleteIssue, setDeleteIssue] = useState<string | undefined>(undefined);
  const [cycleSidebar, setCycleSidebar] = useState(true);

  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | null
  >(null);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: issues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: cycles } = useSWR(
    workspaceSlug && projectId ? CYCLE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => cycleServices.getCycles(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: cycleIssues } = useSWR<CycleIssueResponse[]>(
    workspaceSlug && projectId && cycleId ? CYCLE_ISSUES(cycleId as string) : null,
    workspaceSlug && projectId && cycleId
      ? () =>
          cycleServices.getCycleIssues(
            workspaceSlug as string,
            projectId as string,
            cycleId as string
          )
      : null
  );
  const cycleIssuesArray = cycleIssues?.map((issue) => ({
    ...issue.issue_detail,
    sub_issues_count: issue.sub_issues_count,
    bridge: issue.id,
  }));

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(workspaceSlug as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null,
    {
      onErrorRetry(err, _, __, revalidate, revalidateOpts) {
        if (err?.status === 403) return;
        setTimeout(() => revalidate(revalidateOpts), 5000);
      },
    }
  );

  const openCreateIssueModal = (
    issue?: IIssue,
    actionType: "create" | "edit" | "delete" = "create"
  ) => {
    if (issue) {
      setPreloadedData(null);
      setSelectedIssues({ ...issue, actionType });
    } else setSelectedIssues(null);

    setIsIssueModalOpen(true);
  };

  const openIssuesListModal = () => {
    setCycleIssuesListModal(true);
  };

  const handleAddIssuesToCycle = async (data: { issues: string[] }) => {
    if (workspaceSlug && projectId) {
      await issuesServices
        .addIssueToCycle(workspaceSlug as string, projectId as string, cycleId as string, data)
        .then((res) => {
          console.log(res);
          mutate(CYCLE_ISSUES(cycleId as string));
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  const removeIssueFromCycle = (bridgeId: string) => {
    if (!workspaceSlug || !projectId) return;

    mutate<CycleIssueResponse[]>(
      CYCLE_ISSUES(cycleId as string),
      (prevData) => prevData?.filter((p) => p.id !== bridgeId),
      false
    );

    issuesServices
      .removeIssueFromCycle(
        workspaceSlug as string,
        projectId as string,
        cycleId as string,
        bridgeId
      )
      .then((res) => {
        console.log(res);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return (
    <IssueViewContextProvider>
      <CreateUpdateIssueModal
        isOpen={isIssueModalOpen && selectedIssues?.actionType !== "delete"}
        data={selectedIssues}
        prePopulateData={
          preloadedData
            ? { cycle: cycleId as string, ...preloadedData }
            : { cycle: cycleId as string, ...selectedIssues }
        }
        handleClose={() => setIsIssueModalOpen(false)}
      />
      <ExistingIssuesListModal
        isOpen={cycleIssuesListModal}
        handleClose={() => setCycleIssuesListModal(false)}
        type="cycle"
        issues={issues?.results.filter((i) => !i.issue_cycle) ?? []}
        handleOnSubmit={handleAddIssuesToCycle}
      />
      <ConfirmIssueDeletion
        handleClose={() => setDeleteIssue(undefined)}
        isOpen={!!deleteIssue}
        data={issues?.results.find((issue) => issue.id === deleteIssue)}
      />
      <AppLayout
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
                <ArrowPathIcon className="h-3 w-3" />
                {cycles?.find((c) => c.id === cycleId)?.name}
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
                {cycle.name}
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
        }
        right={
          <div
            className={`flex items-center gap-2 ${cycleSidebar ? "mr-[24rem]" : ""} duration-300`}
          >
            <View issues={cycleIssuesArray ?? []} />
            <button
              type="button"
              className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-100 ${
                cycleSidebar ? "rotate-180" : ""
              }`}
              onClick={() => setCycleSidebar((prevData) => !prevData)}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
          </div>
        }
      >
        {cycleIssuesArray ? (
          cycleIssuesArray.length > 0 ? (
            <div className={`h-full ${cycleSidebar ? "mr-[24rem]" : ""} duration-300`}>
              <CyclesListView
                issues={cycleIssuesArray ?? []}
                openCreateIssueModal={openCreateIssueModal}
                openIssuesListModal={openIssuesListModal}
                removeIssueFromCycle={removeIssueFromCycle}
                setPreloadedData={setPreloadedData}
                userAuth={props}
              />
              <CyclesBoardView
                issues={cycleIssuesArray ?? []}
                members={members}
                openCreateIssueModal={openCreateIssueModal}
                openIssuesListModal={openIssuesListModal}
                handleDeleteIssue={setDeleteIssue}
                setPreloadedData={setPreloadedData}
                userAuth={props}
              />
            </div>
          ) : (
            <div
              className={`flex h-full flex-col items-center justify-center px-4 ${
                cycleSidebar ? "mr-[24rem]" : ""
              } duration-300`}
            >
              <EmptySpace
                title="You don't have any issue yet."
                description="A cycle is a fixed time period where a team commits to a set number of issues from their backlog. Cycles are usually one, two, or four weeks long."
                Icon={ArrowPathIcon}
              >
                <EmptySpaceItem
                  title="Create a new issue"
                  description="Click to create a new issue inside the cycle."
                  Icon={PlusIcon}
                  action={() => openCreateIssueModal()}
                />
                <EmptySpaceItem
                  title="Add an existing issue"
                  description="Open list"
                  Icon={ListBulletIcon}
                  action={() => openIssuesListModal()}
                />
              </EmptySpace>
            </div>
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        )}
        <CycleDetailSidebar
          cycle={cycles?.find((c) => c.id === (cycleId as string))}
          isOpen={cycleSidebar}
          cycleIssues={cycleIssues ?? []}
        />
      </AppLayout>
    </IssueViewContextProvider>
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);
  const redirectAfterSignIn = ctx.req?.url;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  const projectId = ctx.query.projectId as string;
  const workspaceSlug = ctx.query.workspaceSlug as string;

  const memberDetail = await requiredAdmin(workspaceSlug, projectId, ctx.req?.headers.cookie);

  return {
    props: {
      isOwner: memberDetail?.role === 20,
      isMember: memberDetail?.role === 15,
      isViewer: memberDetail?.role === 10,
      isGuest: memberDetail?.role === 5,
    },
  };
};

export default SingleCycle;
