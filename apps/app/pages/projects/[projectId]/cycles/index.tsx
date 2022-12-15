// react
import React, { useEffect, useState } from "react";
// next
import { useRouter } from "next/router";
import type { NextPage } from "next";
// swr
import useSWR from "swr";
// services
import sprintService from "lib/services/cycles.service";
// hooks
import useUser from "lib/hooks/useUser";
import useIssuesProperties from "lib/hooks/useIssuesProperties";
// fetching keys
import { CYCLE_LIST } from "constants/fetch-keys";
// hoc
import withAuth from "lib/hoc/withAuthWrapper";
// layouts
import AppLayout from "layouts/app-layout";
// components
import CycleIssuesListModal from "components/project/cycles/CycleIssuesListModal";
import ConfirmIssueDeletion from "components/project/issues/confirm-issue-deletion";
import ConfirmSprintDeletion from "components/project/cycles/ConfirmCycleDeletion";
import CreateUpdateIssuesModal from "components/project/issues/CreateUpdateIssueModal";
import CreateUpdateSprintsModal from "components/project/cycles/CreateUpdateCyclesModal";
import CycleStatsView from "components/project/cycles/stats-view";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { BreadcrumbItem, Breadcrumbs, HeaderButton, Spinner, EmptySpace, EmptySpaceItem } from "ui";
// icons
import { ArrowPathIcon, ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, ICycle, SelectSprintType, SelectIssue, Properties } from "types";
// constants
import { classNames, replaceUnderscoreIfSnakeCase } from "constants/common";

const ProjectSprints: NextPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<SelectSprintType>();

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<SelectIssue>();
  const [deleteIssue, setDeleteIssue] = useState<string | undefined>();
  const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);
  const [cycleId, setCycleId] = useState("");

  const { activeWorkspace, activeProject, issues } = useUser();

  const router = useRouter();

  const { projectId } = router.query;

  const { data: cycles } = useSWR<ICycle[]>(
    activeWorkspace && projectId ? CYCLE_LIST(projectId as string) : null,
    activeWorkspace && projectId
      ? () => sprintService.getCycles(activeWorkspace.slug, projectId as string)
      : null
  );

  const [properties, setProperties] = useIssuesProperties(
    activeWorkspace?.slug,
    projectId as string
  );

  const openCreateIssueModal = (
    cycleId: string,
    issue?: IIssue,
    actionType: "create" | "edit" | "delete" = "create"
  ) => {
    const cycle = cycles?.find((cycle) => cycle.id === cycleId);
    if (cycle) {
      setSelectedSprint({
        ...cycle,
        actionType: "create-issue",
      });
      if (issue) setSelectedIssues({ ...issue, actionType });
      setIsIssueModalOpen(true);
    }
  };

  const openIssuesListModal = (cycleId: string) => {
    setCycleId(cycleId);
    setCycleIssuesListModal(true);
  };

  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => {
      setSelectedSprint(undefined);
      clearTimeout(timer);
    }, 500);
  }, [isOpen]);

  useEffect(() => {
    if (selectedIssues?.actionType === "delete") {
      setDeleteIssue(selectedIssues.id);
    }
  }, [selectedIssues]);

  return (
    <AppLayout
      meta={{
        title: "Plane - Cycles",
      }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link="/projects" />
          <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Cycles`} />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-2">
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
                  <Popover.Panel className="absolute mr-5 right-1/2 z-10 mt-1 w-screen max-w-xs translate-x-1/2 transform p-4 bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="relative flex flex-col gap-1 gap-y-4">
                      <div className="relative flex flex-col gap-1">
                        <h4 className="text-base text-gray-600">Properties</h4>
                        <div>
                          {Object.keys(properties).map((key) => (
                            <button
                              key={key}
                              type="button"
                              className={`px-2 py-1 inline capitalize rounded border border-theme text-sm m-1 ${
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
          <HeaderButton Icon={PlusIcon} label="Add Cycle" onClick={() => setIsOpen(true)} />
        </div>
      }
    >
      <CreateUpdateSprintsModal
        isOpen={
          isOpen &&
          selectedSprint?.actionType !== "delete" &&
          selectedSprint?.actionType !== "create-issue"
        }
        setIsOpen={setIsOpen}
        data={selectedSprint}
        projectId={projectId as string}
      />
      <ConfirmSprintDeletion
        isOpen={isOpen && !!selectedSprint && selectedSprint.actionType === "delete"}
        setIsOpen={setIsOpen}
        data={selectedSprint}
      />
      <ConfirmIssueDeletion
        handleClose={() => setDeleteIssue(undefined)}
        isOpen={!!deleteIssue}
        data={selectedIssues}
      />
      <CreateUpdateIssuesModal
        isOpen={
          isIssueModalOpen &&
          selectedSprint?.actionType === "create-issue" &&
          selectedIssues?.actionType !== "delete"
        }
        data={selectedIssues}
        prePopulateData={{ sprints: selectedSprint?.id }}
        setIsOpen={setIsOpen}
        projectId={projectId as string}
      />
      <CycleIssuesListModal
        isOpen={cycleIssuesListModal}
        handleClose={() => setCycleIssuesListModal(false)}
        issues={issues}
        cycleId={cycleId}
      />
      {cycles ? (
        cycles.length > 0 ? (
          <div className="space-y-5">
            <CycleStatsView cycles={cycles} />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center px-4">
            <EmptySpace
              title="You don't have any cycle yet."
              description="A cycle is a fixed time period where a team commits to a set number of issues from their backlog. Cycles are usually one, two, or four weeks long."
              Icon={ArrowPathIcon}
            >
              <EmptySpaceItem
                title="Create a new cycle"
                description={
                  <span>
                    Use <pre className="inline bg-gray-100 px-2 py-1 rounded">Ctrl/Command + Q</pre>{" "}
                    shortcut to create a new cycle
                  </span>
                }
                Icon={PlusIcon}
                action={() => setIsOpen(true)}
              />
            </EmptySpace>
          </div>
        )
      ) : (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      )}
    </AppLayout>
  );
};

export default withAuth(ProjectSprints);
