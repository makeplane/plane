import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import issuesService from "services/issues.service";
// hooks
import useUser from "hooks/use-user";
import useIssuesView from "hooks/use-issues-view";
import useCalendarIssuesView from "hooks/use-calendar-issues-view";
import useToast from "hooks/use-toast";
import useSpreadsheetIssuesView from "hooks/use-spreadsheet-issues-view";
import useProjects from "hooks/use-projects";
import useMyIssues from "hooks/my-issues/use-my-issues";
// components
import { DraftIssueForm } from "components/issues";
// types
import type { IIssue } from "types";
// fetch-keys
import {
  PROJECT_ISSUES_DETAILS,
  USER_ISSUE,
  SUB_ISSUES,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  VIEW_ISSUES,
  PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS,
} from "constants/fetch-keys";

interface IssuesModalProps {
  data?: IIssue | null;
  handleClose: () => void;
  isOpen: boolean;
  isUpdatingSingleIssue?: boolean;
  prePopulateData?: Partial<IIssue>;
  fieldsToShow?: (
    | "project"
    | "name"
    | "description"
    | "state"
    | "priority"
    | "assignee"
    | "label"
    | "startDate"
    | "dueDate"
    | "estimate"
    | "parent"
    | "all"
  )[];
  onSubmit?: (data: Partial<IIssue>) => Promise<void> | void;
}

export const CreateUpdateDraftIssueModal: React.FC<IssuesModalProps> = ({
  data,
  handleClose,
  isOpen,
  isUpdatingSingleIssue = false,
  prePopulateData,
  fieldsToShow = ["all"],
  onSubmit,
}) => {
  // states
  const [createMore, setCreateMore] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const { displayFilters, params } = useIssuesView();
  const { params: calendarParams } = useCalendarIssuesView();
  const { ...viewGanttParams } = params;
  const { params: spreadsheetParams } = useSpreadsheetIssuesView();

  const { user } = useUser();
  const { projects } = useProjects();

  const { groupedIssues, mutateMyIssues } = useMyIssues(workspaceSlug?.toString());

  const { setToastAlert } = useToast();

  if (cycleId) prePopulateData = { ...prePopulateData, cycle: cycleId as string };
  if (moduleId) prePopulateData = { ...prePopulateData, module: moduleId as string };
  if (router.asPath.includes("my-issues") || router.asPath.includes("assigned"))
    prePopulateData = {
      ...prePopulateData,
      assignees: [...(prePopulateData?.assignees ?? []), user?.id ?? ""],
    };

  const onClose = () => {
    handleClose();
    setActiveProject(null);
  };

  useEffect(() => {
    // if modal is closed, reset active project to null
    // and return to avoid activeProject being set to some other project
    if (!isOpen) {
      setActiveProject(null);
      return;
    }

    // if data is present, set active project to the project of the
    // issue. This has more priority than the project in the url.
    if (data && data.project) {
      setActiveProject(data.project);
      return;
    }

    // if data is not present, set active project to the project
    // in the url. This has the least priority.
    if (projects && projects.length > 0 && !activeProject)
      setActiveProject(projects?.find((p) => p.id === projectId)?.id ?? projects?.[0].id ?? null);
  }, [activeProject, data, projectId, projects, isOpen]);

  const calendarFetchKey = cycleId
    ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), calendarParams)
    : moduleId
    ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString(), calendarParams)
    : viewId
    ? VIEW_ISSUES(viewId.toString(), calendarParams)
    : PROJECT_ISSUES_LIST_WITH_PARAMS(activeProject?.toString() ?? "", calendarParams);

  const spreadsheetFetchKey = cycleId
    ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), spreadsheetParams)
    : moduleId
    ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString(), spreadsheetParams)
    : viewId
    ? VIEW_ISSUES(viewId.toString(), spreadsheetParams)
    : PROJECT_ISSUES_LIST_WITH_PARAMS(activeProject?.toString() ?? "", spreadsheetParams);

  const ganttFetchKey = cycleId
    ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString())
    : moduleId
    ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString())
    : viewId
    ? VIEW_ISSUES(viewId.toString(), viewGanttParams)
    : PROJECT_ISSUES_LIST_WITH_PARAMS(activeProject?.toString() ?? "");

  const createIssue = async (payload: Partial<IIssue>) => {
    if (!workspaceSlug || !activeProject || !user) return;

    await issuesService
      .createDraftIssue(workspaceSlug as string, activeProject ?? "", payload, user)
      .then(async () => {
        mutate(PROJECT_ISSUES_LIST_WITH_PARAMS(activeProject ?? "", params));
        mutate(PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS(activeProject ?? "", params));

        if (displayFilters.layout === "calendar") mutate(calendarFetchKey);
        if (displayFilters.layout === "gantt_chart")
          mutate(ganttFetchKey, {
            start_target_date: true,
            order_by: "sort_order",
          });
        if (displayFilters.layout === "spreadsheet") mutate(spreadsheetFetchKey);
        if (groupedIssues) mutateMyIssues();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });

        if (payload.assignees_list?.some((assignee) => assignee === user?.id))
          mutate(USER_ISSUE(workspaceSlug as string));

        if (payload.parent && payload.parent !== "") mutate(SUB_ISSUES(payload.parent));
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be created. Please try again.",
        });
      });

    if (!createMore) onClose();
  };

  const updateIssue = async (payload: Partial<IIssue>) => {
    if (!user) return;

    await issuesService
      .updateDraftIssue(workspaceSlug as string, activeProject ?? "", data?.id ?? "", payload, user)
      .then((res) => {
        if (isUpdatingSingleIssue) {
          mutate<IIssue>(PROJECT_ISSUES_DETAILS, (prevData) => ({ ...prevData, ...res }), false);
        } else {
          if (displayFilters.layout === "calendar") mutate(calendarFetchKey);
          if (displayFilters.layout === "spreadsheet") mutate(spreadsheetFetchKey);
          if (payload.parent) mutate(SUB_ISSUES(payload.parent.toString()));
          mutate(PROJECT_ISSUES_LIST_WITH_PARAMS(activeProject ?? "", params));
          mutate(PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS(activeProject ?? "", params));
        }

        if (!createMore) onClose();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be updated. Please try again.",
        });
      });
  };

  const handleFormSubmit = async (formData: Partial<IIssue>) => {
    if (!workspaceSlug || !activeProject) return;

    const payload: Partial<IIssue> = {
      ...formData,
      assignees_list: formData.assignees ?? [],
      labels_list: formData.labels ?? [],
      description: formData.description ?? "",
      description_html: formData.description_html ?? "<p></p>",
    };

    if (!data) await createIssue(payload);
    else await updateIssue(payload);

    if (onSubmit) await onSubmit(payload);
  };

  if (!projects || projects.length === 0) return null;

  return (
    <>
      <Transition.Root show={isOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-20" onClose={onClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="my-10 flex items-center justify-center p-4 text-center sm:p-0 md:my-20">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 p-5 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                  <DraftIssueForm
                    handleFormSubmit={handleFormSubmit}
                    prePopulatedData={prePopulateData}
                    data={data}
                    createMore={createMore}
                    setCreateMore={setCreateMore}
                    handleClose={onClose}
                    projectId={activeProject ?? ""}
                    setActiveProject={setActiveProject}
                    status={data ? true : false}
                    user={user}
                    fieldsToShow={fieldsToShow}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
