import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import { IssueService, IssueDraftService } from "services/issue";
import { ModuleService } from "services/module.service";
// hooks
import useUser from "hooks/use-user";
import useIssuesView from "hooks/use-issues-view";
import useToast from "hooks/use-toast";
import useLocalStorage from "hooks/use-local-storage";
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
  CYCLE_DETAILS,
  MODULE_DETAILS,
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

// services
const issueService = new IssueService();
const issueDraftService = new IssueDraftService();
const moduleService = new ModuleService();

export const CreateUpdateDraftIssueModal: React.FC<IssuesModalProps> = (props) => {
  const {
    data,
    handleClose,
    isOpen,
    isUpdatingSingleIssue = false,
    prePopulateData: prePopulateDataProps,
    fieldsToShow = ["all"],
    onSubmit,
  } = props;

  // states
  const [createMore, setCreateMore] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [prePopulateData, setPreloadedData] = useState<Partial<IIssue> | undefined>(undefined);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const { displayFilters, params } = useIssuesView();
  const { ...viewGanttParams } = params;

  const { user } = useUser();
  const { projects } = useProjects();

  const { clearValue: clearDraftIssueLocalStorage } = useLocalStorage("draftedIssue", {});

  const { groupedIssues, mutateMyIssues } = useMyIssues(workspaceSlug?.toString());

  const { setToastAlert } = useToast();

  const onClose = () => {
    handleClose();
    setActiveProject(null);
  };

  const onDiscard = () => {
    clearDraftIssueLocalStorage();
    onClose();
  };

  useEffect(() => {
    setPreloadedData(prePopulateDataProps ?? {});

    if (cycleId && !prePopulateDataProps?.cycle) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        cycle: cycleId.toString(),
      }));
    }
    if (moduleId && !prePopulateDataProps?.module) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        module: moduleId.toString(),
      }));
    }
    if (
      (router.asPath.includes("my-issues") || router.asPath.includes("assigned")) &&
      !prePopulateDataProps?.assignees
    ) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        assignees: prePopulateDataProps?.assignees ?? [user?.id ?? ""],
      }));
    }
  }, [prePopulateDataProps, cycleId, moduleId, router.asPath, user?.id]);

  useEffect(() => {
    setPreloadedData(prePopulateDataProps ?? {});

    if (cycleId && !prePopulateDataProps?.cycle) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        cycle: cycleId.toString(),
      }));
    }
    if (moduleId && !prePopulateDataProps?.module) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        module: moduleId.toString(),
      }));
    }
    if (
      (router.asPath.includes("my-issues") || router.asPath.includes("assigned")) &&
      !prePopulateDataProps?.assignees
    ) {
      setPreloadedData((prevData) => ({
        ...(prevData ?? {}),
        ...prePopulateDataProps,
        assignees: prePopulateDataProps?.assignees ?? [user?.id ?? ""],
      }));
    }
  }, [prePopulateDataProps, cycleId, moduleId, router.asPath, user?.id]);

  useEffect(() => {
    // if modal is closed, reset active project to null
    // and return to avoid activeProject being set to some other project
    if (!isOpen) {
      setActiveProject(null);
      return;
    }

    // if data is present, set active project to the project of the
    // issue. This has more priority than the project in the url.
    if (data && data.project) return setActiveProject(data.project);

    if (prePopulateData && prePopulateData.project && !activeProject) return setActiveProject(prePopulateData.project);

    if (prePopulateData && prePopulateData.project && !activeProject) return setActiveProject(prePopulateData.project);

    // if data is not present, set active project to the project
    // in the url. This has the least priority.
    if (projects && projects.length > 0 && !activeProject)
      setActiveProject(projects?.find((p) => p.id === projectId)?.id ?? projects?.[0].id ?? null);
  }, [activeProject, data, projectId, projects, isOpen, prePopulateData]);

  const ganttFetchKey = cycleId
    ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString())
    : moduleId
    ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString())
    : viewId
    ? VIEW_ISSUES(viewId.toString(), viewGanttParams)
    : PROJECT_ISSUES_LIST_WITH_PARAMS(activeProject?.toString() ?? "");

  const createDraftIssue = async (payload: Partial<IIssue>) => {
    if (!workspaceSlug || !activeProject || !user) return;

    await issueDraftService
      .createDraftIssue(workspaceSlug as string, activeProject ?? "", payload)
      .then(async () => {
        mutate(PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS(activeProject ?? "", params));

        if (groupedIssues) mutateMyIssues();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });

        if (payload.assignees_list?.some((assignee) => assignee === user?.id))
          mutate(USER_ISSUE(workspaceSlug as string));
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

  const updateDraftIssue = async (payload: Partial<IIssue>) => {
    if (!user) return;

    await issueDraftService
      .updateDraftIssue(workspaceSlug as string, activeProject ?? "", data?.id ?? "", payload)
      .then((res) => {
        if (isUpdatingSingleIssue) {
          mutate<IIssue>(PROJECT_ISSUES_DETAILS, (prevData) => ({ ...prevData, ...res }), false);
        } else {
          if (payload.parent) mutate(SUB_ISSUES(payload.parent.toString()));
          mutate(PROJECT_ISSUES_LIST_WITH_PARAMS(activeProject ?? "", params));
          mutate(PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS(activeProject ?? "", params));
        }

        if (!payload.is_draft) {
          if (payload.cycle && payload.cycle !== "") addIssueToCycle(res.id, payload.cycle);
          if (payload.module && payload.module !== "") addIssueToModule(res.id, payload.module);
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

  const addIssueToCycle = async (issueId: string, cycleId: string) => {
    if (!workspaceSlug || !activeProject) return;

    await issueService
      .addIssueToCycle(
        workspaceSlug as string,
        activeProject ?? "",
        cycleId,
        {
          issues: [issueId],
        },
        user
      )
      .then(() => {
        if (cycleId) {
          mutate(CYCLE_ISSUES_WITH_PARAMS(cycleId, params));
          mutate(CYCLE_DETAILS(cycleId as string));
        }
      });
  };

  const addIssueToModule = async (issueId: string, moduleId: string) => {
    if (!workspaceSlug || !activeProject) return;

    await moduleService
      .addIssuesToModule(
        workspaceSlug as string,
        activeProject ?? "",
        moduleId as string,
        {
          issues: [issueId],
        },
        user
      )
      .then(() => {
        if (moduleId) {
          mutate(MODULE_ISSUES_WITH_PARAMS(moduleId as string, params));
          mutate(MODULE_DETAILS(moduleId as string));
        }
      });
  };

  const createIssue = async (payload: Partial<IIssue>) => {
    if (!workspaceSlug || !activeProject) return;

    await issueService
      .createIssues(workspaceSlug as string, activeProject ?? "", payload, user)
      .then(async (res) => {
        mutate(PROJECT_ISSUES_LIST_WITH_PARAMS(activeProject ?? "", params));
        if (payload.cycle && payload.cycle !== "") await addIssueToCycle(res.id, payload.cycle);
        if (payload.module && payload.module !== "") await addIssueToModule(res.id, payload.module);

        if (displayFilters.layout === "gantt_chart")
          mutate(ganttFetchKey, {
            start_target_date: true,
            order_by: "sort_order",
          });
        if (groupedIssues) mutateMyIssues();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });

        if (!createMore) onClose();

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
  };

  const handleFormSubmit = async (
    formData: Partial<IIssue>,
    action: "createDraft" | "createNewIssue" | "updateDraft" | "convertToNewIssue" = "createDraft"
  ) => {
    if (!workspaceSlug || !activeProject) return;

    const payload: Partial<IIssue> = {
      ...formData,
      assignees_list: formData.assignees ?? [],
      labels_list: formData.labels ?? [],
      description: formData.description ?? "",
      description_html: formData.description_html ?? "<p></p>",
    };

    if (action === "createDraft") await createDraftIssue(payload);
    else if (action === "updateDraft" || action === "convertToNewIssue") await updateDraftIssue(payload);
    else if (action === "createNewIssue") await createIssue(payload);

    clearDraftIssueLocalStorage();

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
                    isOpen={isOpen}
                    handleFormSubmit={handleFormSubmit}
                    prePopulatedData={prePopulateData}
                    data={data}
                    createMore={createMore}
                    setCreateMore={setCreateMore}
                    handleClose={onClose}
                    handleDiscard={onDiscard}
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
