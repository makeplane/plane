// react
import React, { useState } from "react";
// next
import { useRouter } from "next/router";
// swr
import useSWR, { mutate } from "swr";
// layouots
import AppLayout from "layouts/app-layout";
// components
import CyclesListView from "components/project/cycles/list-view";
import CyclesBoardView from "components/project/cycles/board-view";
import CreateUpdateIssuesModal from "components/project/issues/create-update-issue-modal";
import ConfirmIssueDeletion from "components/project/issues/confirm-issue-deletion";
import ExistingIssuesListModal from "components/common/existing-issues-list-modal";
import CycleDetailSidebar from "components/project/cycles/cycle-detail-sidebar";
import View from "components/core/view";
// services
import issuesServices from "lib/services/issues.service";
import cycleServices from "lib/services/cycles.service";
import projectService from "lib/services/project.service";
// hooks
import useIssuesFilter from "lib/hooks/useIssuesFilter";
import useIssuesProperties from "lib/hooks/useIssuesProperties";
// ui
import { BreadcrumbItem, Breadcrumbs, CustomMenu, EmptySpace, EmptySpaceItem, Spinner } from "ui";
// icons
import { Squares2X2Icon } from "@heroicons/react/20/solid";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ListBulletIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
// types
import { CycleIssueResponse, IIssue, SelectIssue } from "types";
// fetch-keys
import {
  CYCLE_ISSUES,
  CYCLE_LIST,
  PROJECT_ISSUES_LIST,
  PROJECT_MEMBERS,
  PROJECT_DETAILS,
} from "constants/fetch-keys";

const SingleCycle: React.FC = () => {
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<SelectIssue>();
  const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);
  const [deleteIssue, setDeleteIssue] = useState<string | undefined>(undefined);
  const [cycleSidebar, setCycleSidebar] = useState(false);

  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

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

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

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
  const cycleIssuesArray = cycleIssues?.map((issue) => {
    return { bridge: issue.id, ...issue.issue_detail };
  });

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

  const partialUpdateIssue = (formData: Partial<IIssue>, issueId: string) => {
    if (!workspaceSlug || !projectId) return;
    issuesServices
      .patchIssue(workspaceSlug as string, projectId as string, issueId, formData)
      .then(() => {
        mutate(CYCLE_ISSUES(cycleId as string));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const {
    issueView,
    groupByProperty,
    setGroupByProperty,
    groupedByIssues,
    setOrderBy,
    setFilterIssue,
    orderBy,
    filterIssue,
    setIssueViewToKanban,
    setIssueViewToList,
    resetFilterToDefault,
    setNewFilterDefaultView,
  } = useIssuesFilter(cycleIssuesArray ?? []);

  const openCreateIssueModal = (
    issue?: IIssue,
    actionType: "create" | "edit" | "delete" = "create"
  ) => {
    if (issue) setSelectedIssues({ ...issue, actionType });
    setIsIssueModalOpen(true);
  };

  const openIssuesListModal = () => {
    setCycleIssuesListModal(true);
  };

  const handleAddIssuesToCycle = (data: { issues: string[] }) => {
    if (workspaceSlug && projectId) {
      issuesServices
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
    <>
      <CreateUpdateIssuesModal
        isOpen={isIssueModalOpen && selectedIssues?.actionType !== "delete"}
        data={selectedIssues}
        prePopulateData={{ cycle: cycleId as string, ...preloadedData }}
        setIsOpen={setIsIssueModalOpen}
        projectId={projectId as string}
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
            <div className="flex items-center gap-x-1">
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                  issueView === "list" ? "bg-gray-200" : ""
                }`}
                onClick={() => setIssueViewToList()}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                  issueView === "kanban" ? "bg-gray-200" : ""
                }`}
                onClick={() => setIssueViewToKanban()}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
            </div>
            <View
              filterIssue={filterIssue}
              setFilterIssue={setFilterIssue}
              groupByProperty={groupByProperty}
              setGroupByProperty={setGroupByProperty}
              orderBy={orderBy}
              setOrderBy={setOrderBy}
              resetFilterToDefault={resetFilterToDefault}
              setNewFilterDefaultView={setNewFilterDefaultView}
            />
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
        {Object.keys(groupedByIssues) ? (
          Object.keys(groupedByIssues).length > 0 ? (
            <div className={`h-full ${cycleSidebar ? "mr-[24rem]" : ""} duration-300`}>
              {issueView === "list" ? (
                <CyclesListView
                  groupedByIssues={groupedByIssues}
                  selectedGroup={groupByProperty}
                  properties={properties}
                  openCreateIssueModal={openCreateIssueModal}
                  openIssuesListModal={openIssuesListModal}
                  removeIssueFromCycle={removeIssueFromCycle}
                  handleDeleteIssue={setDeleteIssue}
                  setPreloadedData={setPreloadedData}
                />
              ) : (
                <CyclesBoardView
                  groupedByIssues={groupedByIssues}
                  properties={properties}
                  removeIssueFromCycle={removeIssueFromCycle}
                  selectedGroup={groupByProperty}
                  members={members}
                  openCreateIssueModal={openCreateIssueModal}
                  openIssuesListModal={openIssuesListModal}
                  handleDeleteIssue={setDeleteIssue}
                  partialUpdateIssue={partialUpdateIssue}
                  setPreloadedData={setPreloadedData}
                />
              )}
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
    </>
  );
};

export default SingleCycle;
