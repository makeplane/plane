// react
import React, { useState } from "react";
// next
import Link from "next/link";
import { useRouter } from "next/router";
// swr
import useSWR, { mutate } from "swr";
// react-beautiful-dnd
import { DropResult } from "react-beautiful-dnd";
// layouots
import AppLayout from "layouts/app-layout";
// components
import CyclesListView from "components/project/cycles/list-view";
import CyclesBoardView from "components/project/cycles/board-view";
// services
import issuesServices from "lib/services/issues.service";
import cycleServices from "lib/services/cycles.service";
import projectService from "lib/services/project.service";
// hooks
import useUser from "lib/hooks/useUser";
import useIssuesFilter from "lib/hooks/useIssuesFilter";
import useIssuesProperties from "lib/hooks/useIssuesProperties";
// headless ui
import { Menu, Popover, Transition } from "@headlessui/react";
// ui
import { BreadcrumbItem, Breadcrumbs, CustomMenu } from "ui";
// icons
import { Squares2X2Icon } from "@heroicons/react/20/solid";
import { ArrowPathIcon, ChevronDownIcon, ListBulletIcon } from "@heroicons/react/24/outline";
// types
import {
  CycleIssueResponse,
  IIssue,
  NestedKeyOf,
  Properties,
  SelectIssue,
  SelectSprintType,
} from "types";
// fetch-keys
import { CYCLE_ISSUES, PROJECT_MEMBERS } from "constants/fetch-keys";
// constants
import { classNames, replaceUnderscoreIfSnakeCase } from "constants/common";
import CreateUpdateIssuesModal from "components/project/issues/CreateUpdateIssueModal";

const groupByOptions: Array<{ name: string; key: NestedKeyOf<IIssue> | null }> = [
  { name: "State", key: "state_detail.name" },
  { name: "Priority", key: "priority" },
  { name: "Created By", key: "created_by" },
  { name: "None", key: null },
];

const orderByOptions: Array<{ name: string; key: NestedKeyOf<IIssue> }> = [
  { name: "Last created", key: "created_at" },
  { name: "Last updated", key: "updated_at" },
  { name: "Priority", key: "priority" },
];

const filterIssueOptions: Array<{
  name: string;
  key: "activeIssue" | "backlogIssue" | null;
}> = [
  {
    name: "All",
    key: null,
  },
  {
    name: "Active Issues",
    key: "activeIssue",
  },
  {
    name: "Backlog Issues",
    key: "backlogIssue",
  },
];

type Props = {};

const SingleCycle: React.FC<Props> = () => {
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<SelectSprintType>();
  const [selectedIssues, setSelectedIssues] = useState<SelectIssue>();

  const { activeWorkspace, activeProject, cycles } = useUser();

  const router = useRouter();

  const { cycleId } = router.query;

  const [properties, setProperties] = useIssuesProperties(
    activeWorkspace?.slug,
    activeProject?.id as string
  );

  const { data: cycleIssues } = useSWR<CycleIssueResponse[]>(
    activeWorkspace && activeProject && cycleId ? CYCLE_ISSUES(cycleId as string) : null,
    activeWorkspace && activeProject && cycleId
      ? () =>
          cycleServices.getCycleIssues(activeWorkspace?.slug, activeProject?.id, cycleId as string)
      : null
  );

  const cycleIssuesArray = cycleIssues?.map((issue) => {
    return issue.issue_details;
  });

  const { data: members } = useSWR(
    activeWorkspace && activeProject ? PROJECT_MEMBERS(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => projectService.projectMembers(activeWorkspace.slug, activeProject.id)
      : null,
    {
      onErrorRetry(err, _, __, revalidate, revalidateOpts) {
        if (err?.status === 403) return;
        setTimeout(() => revalidate(revalidateOpts), 5000);
      },
    }
  );

  const {
    issueView,
    setIssueView,
    groupByProperty,
    setGroupByProperty,
    groupedByIssues,
    setOrderBy,
    setFilterIssue,
    orderBy,
    filterIssue,
  } = useIssuesFilter(cycleIssuesArray ?? []);

  const openCreateIssueModal = (
    issue?: IIssue,
    actionType: "create" | "edit" | "delete" = "create"
  ) => {
    const cycle = cycles?.find((cycle) => cycle.id === cycleId);
    if (cycle) {
      setSelectedCycle({
        ...cycle,
        actionType: "create-issue",
      });
      if (issue) setSelectedIssues({ ...issue, actionType });
      setIsIssueModalOpen(true);
    }
  };

  const addIssueToCycle = (cycleId: string, issueId: string) => {
    if (!activeWorkspace || !activeProject?.id) return;

    issuesServices
      .addIssueToCycle(activeWorkspace.slug, activeProject.id, cycleId, {
        issue: issueId,
      })
      .then((response) => {
        console.log(response);
        mutate(CYCLE_ISSUES(cycleId));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) return;

    if (activeWorkspace && activeProject) {
      // remove issue from the source cycle
      mutate<CycleIssueResponse[]>(
        CYCLE_ISSUES(source.droppableId),
        (prevData) => prevData?.filter((p) => p.id !== result.draggableId.split(",")[0]),
        false
      );

      // add issue to the destination cycle
      mutate(CYCLE_ISSUES(destination.droppableId));

      issuesServices
        .removeIssueFromCycle(
          activeWorkspace.slug,
          activeProject.id,
          source.droppableId,
          result.draggableId.split(",")[0]
        )
        .then((res) => {
          issuesServices
            .addIssueToCycle(activeWorkspace.slug, activeProject.id, destination.droppableId, {
              issue: result.draggableId.split(",")[1],
            })
            .then((res) => {
              console.log(res);
            })
            .catch((e) => {
              console.log(e);
            });
        })
        .catch((e) => {
          console.log(e);
        });
    }
    // console.log(result);
  };

  const removeIssueFromCycle = (cycleId: string, bridgeId: string) => {
    if (activeWorkspace && activeProject) {
      mutate<CycleIssueResponse[]>(
        CYCLE_ISSUES(cycleId),
        (prevData) => prevData?.filter((p) => p.id !== bridgeId),
        false
      );

      issuesServices
        .removeIssueFromCycle(activeWorkspace.slug, activeProject.id, cycleId, bridgeId)
        .then((res) => {
          console.log(res);
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  return (
    <>
      <CreateUpdateIssuesModal
        isOpen={
          isIssueModalOpen &&
          selectedCycle?.actionType === "create-issue" &&
          selectedIssues?.actionType !== "delete"
        }
        data={selectedIssues}
        prePopulateData={{ sprints: selectedCycle?.id }}
        setIsOpen={setIsIssueModalOpen}
        projectId={activeProject?.id}
      />
      <AppLayout
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${activeProject?.name ?? "Project"} Cycles`}
              link={`/projects/${activeProject?.id}/cycles`}
            />
          </Breadcrumbs>
        }
        left={
          <Menu as="div" className="relative inline-block">
            <Menu.Button className="flex items-center gap-1 border ml-2 px-2 py-1 rounded hover:bg-gray-100 text-xs font-medium">
              <ArrowPathIcon className="h-3 w-3" />
              {cycles?.find((c) => c.id === cycleId)?.name}
            </Menu.Button>

            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-3 mt-2 p-1 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                {cycles?.map((cycle) => (
                  <Menu.Item key={cycle.id}>
                    <Link href={`/projects/${activeProject?.id}/cycles/${cycle.id}`}>
                      <a
                        className={`block text-left p-2 text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap w-full ${
                          cycle.id === cycleId ? "bg-theme text-white" : ""
                        }`}
                      >
                        {cycle.name}
                      </a>
                    </Link>
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
        }
        right={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-x-1">
              <button
                type="button"
                className={`h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-200 duration-300 outline-none ${
                  issueView === "list" ? "bg-gray-200" : ""
                }`}
                onClick={() => {
                  setIssueView("list");
                  setGroupByProperty(null);
                }}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-200 duration-300 outline-none ${
                  issueView === "kanban" ? "bg-gray-200" : ""
                }`}
                onClick={() => {
                  setIssueView("kanban");
                  setGroupByProperty("state_detail.name");
                }}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
            </div>
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button
                    className={classNames(
                      open ? "bg-gray-100 text-gray-900" : "text-gray-500",
                      "group flex gap-2 items-center rounded-md bg-transparent text-xs font-medium hover:bg-gray-100 hover:text-gray-900 focus:outline-none border p-2"
                    )}
                  >
                    <span>View</span>
                    <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                  </Popover.Button>

                  <Transition
                    as={React.Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute mr-5 right-1/2 z-10 mt-1 w-screen max-w-xs translate-x-1/2 transform p-3 bg-white rounded-lg shadow-lg overflow-hidden">
                      <div className="relative flex flex-col gap-1 gap-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm text-gray-600">Group by</h4>
                          <CustomMenu
                            label={
                              groupByOptions.find((option) => option.key === groupByProperty)
                                ?.name ?? "Select"
                            }
                          >
                            {groupByOptions.map((option) => (
                              <CustomMenu.MenuItem
                                key={option.key}
                                onClick={() => setGroupByProperty(option.key)}
                              >
                                {option.name}
                              </CustomMenu.MenuItem>
                            ))}
                          </CustomMenu>
                        </div>
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm text-gray-600">Order by</h4>
                          <CustomMenu
                            label={
                              orderByOptions.find((option) => option.key === orderBy)?.name ??
                              "Select"
                            }
                          >
                            {orderByOptions.map((option) =>
                              groupByProperty === "priority" && option.key === "priority" ? null : (
                                <CustomMenu.MenuItem
                                  key={option.key}
                                  onClick={() => setOrderBy(option.key)}
                                >
                                  {option.name}
                                </CustomMenu.MenuItem>
                              )
                            )}
                          </CustomMenu>
                        </div>
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm text-gray-600">Issue type</h4>
                          <CustomMenu
                            label={
                              filterIssueOptions.find((option) => option.key === filterIssue)
                                ?.name ?? "Select"
                            }
                          >
                            {filterIssueOptions.map((option) => (
                              <CustomMenu.MenuItem
                                key={option.key}
                                onClick={() => setFilterIssue(option.key)}
                              >
                                {option.name}
                              </CustomMenu.MenuItem>
                            ))}
                          </CustomMenu>
                        </div>
                        <div className="border-b-2"></div>
                        <div className="relative flex flex-col gap-1">
                          <h4 className="text-base text-gray-600">Properties</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            {Object.keys(properties).map((key) => (
                              <button
                                key={key}
                                type="button"
                                className={`px-2 py-1 capitalize rounded border border-theme text-xs ${
                                  properties[key as keyof Properties]
                                    ? "border-theme bg-theme text-white"
                                    : ""
                                }`}
                                onClick={() => setProperties(key as keyof Properties)}
                              >
                                {replaceUnderscoreIfSnakeCase(key)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </div>
        }
      >
        {issueView === "list" ? (
          <CyclesListView
            groupedByIssues={groupedByIssues}
            selectedGroup={groupByProperty}
            properties={properties}
            openCreateIssueModal={openCreateIssueModal}
            openIssuesListModal={() => {
              return;
            }}
            removeIssueFromCycle={removeIssueFromCycle}
          />
        ) : (
          <div className="h-screen">
            <CyclesBoardView
              groupedByIssues={groupedByIssues}
              properties={properties}
              removeIssueFromCycle={removeIssueFromCycle}
              selectedGroup={groupByProperty}
              members={members}
              openCreateIssueModal={openCreateIssueModal}
              openIssuesListModal={() => {
                return;
              }}
            />
          </div>
        )}
      </AppLayout>
    </>
  );
};

export default SingleCycle;
