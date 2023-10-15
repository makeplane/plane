import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { Dialog, Transition } from "@headlessui/react";
// services
import { ModuleService } from "services/module.service";
import { IssueService, IssueDraftService } from "services/issue";
import { InboxService } from "services/inbox.service";
// hooks
import useUser from "hooks/use-user";
import useIssuesView from "hooks/use-issues-view";
import useToast from "hooks/use-toast";
import useInboxView from "hooks/use-inbox-view";
import useProjects from "hooks/use-projects";
import useMyIssues from "hooks/my-issues/use-my-issues";
import useLocalStorage from "hooks/use-local-storage";
// components
import { IssueForm, ConfirmIssueDiscard } from "components/issues";
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
  CYCLE_DETAILS,
  MODULE_DETAILS,
  VIEW_ISSUES,
  INBOX_ISSUES,
  PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS,
  GLOBAL_VIEW_ISSUES,
} from "constants/fetch-keys";
// constants
import { INBOX_ISSUE_SOURCE } from "constants/inbox";

export interface IssuesModalProps {
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
  onSubmit?: (data: Partial<IIssue>) => Promise<void>;
}

const moduleService = new ModuleService();
const inboxService = new InboxService();
const issueService = new IssueService();
const issueDraftService = new IssueDraftService();

export const CreateUpdateIssueModal: React.FC<IssuesModalProps> = ({
  data,
  handleClose,
  isOpen,
  isUpdatingSingleIssue = false,
  prePopulateData: prePopulateDataProps,
  fieldsToShow = ["all"],
  onSubmit,
}) => {
  // states
  const [createMore, setCreateMore] = useState(false);
  const [formDirtyState, setFormDirtyState] = useState<any>(null);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [prePopulateData, setPreloadedData] = useState<Partial<IIssue>>({});

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId, globalViewId, inboxId } = router.query;

  const { displayFilters, params } = useIssuesView();
  const { ...viewGanttParams } = params;
  const { params: inboxParams } = useInboxView();

  const { user } = useUser();
  const { projects } = useProjects();

  const { groupedIssues, mutateMyIssues } = useMyIssues(workspaceSlug?.toString());

  const globalViewParams = {};

  const { setValue: setValueInLocalStorage, clearValue: clearLocalStorageValue } = useLocalStorage<any>(
    "draftedIssue",
    {}
  );

  const { setToastAlert } = useToast();

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

  /**
   *
   * @description This function is used to close the modals. This function will show a confirm discard modal if the form is dirty.
   * @returns void
   */

  const onClose = () => {
    if (!showConfirmDiscard) handleClose();
    if (formDirtyState === null) return setActiveProject(null);
    const data = JSON.stringify(formDirtyState);
    setValueInLocalStorage(data);
  };

  /**
   * @description This function is used to close the modals. This function is to be used when the form is submitted,
   * meaning we don't need to show the confirm discard modal or store the form data in local storage.
   */

  const onFormSubmitClose = () => {
    setFormDirtyState(null);
    handleClose();
  };

  /**
   * @description This function is used to close the modals. This function is to be used when we click outside the modal,
   * meaning we don't need to show the confirm discard modal but will store the form data in local storage.
   * Use this function when you want to store the form data in local storage.
   */

  const onDiscardClose = () => {
    if (formDirtyState !== null) {
      setShowConfirmDiscard(true);
    } else {
      handleClose();
      setActiveProject(null);
    }
  };

  const handleFormDirty = (data: any) => {
    setFormDirtyState(data);
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

  const addIssueToInbox = async (formData: Partial<IIssue>) => {
    if (!workspaceSlug || !activeProject || !inboxId) return;

    const payload = {
      issue: {
        name: formData.name,
        description: formData.description,
        description_html: formData.description_html,
        priority: formData.priority,
      },
      source: INBOX_ISSUE_SOURCE,
    };

    await inboxService
      .createInboxIssue(workspaceSlug.toString(), activeProject.toString(), inboxId.toString(), payload, user)
      .then((res) => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue created successfully.",
        });

        router.push(
          `/${workspaceSlug}/projects/${activeProject}/inbox/${inboxId}?inboxIssueId=${res.issue_inbox[0].id}`
        );

        mutate(INBOX_ISSUES(inboxId.toString(), inboxParams));
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be created. Please try again.",
        });
      });
  };

  const workspaceIssuesPath = [
    {
      params: {
        sub_issue: false,
      },
      path: "workspace-views/all-issues",
    },
    {
      params: {
        assignees: user?.id ?? undefined,
        sub_issue: false,
      },
      path: "workspace-views/assigned",
    },
    {
      params: {
        created_by: user?.id ?? undefined,
        sub_issue: false,
      },
      path: "workspace-views/created",
    },
    {
      params: {
        subscriber: user?.id ?? undefined,
        sub_issue: false,
      },
      path: "workspace-views/subscribed",
    },
  ];

  const currentWorkspaceIssuePath = workspaceIssuesPath.find((path) => router.pathname.includes(path.path));

  const ganttFetchKey = cycleId
    ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString())
    : moduleId
    ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString())
    : viewId
    ? VIEW_ISSUES(viewId.toString(), viewGanttParams)
    : PROJECT_ISSUES_LIST_WITH_PARAMS(activeProject?.toString() ?? "");

  const createIssue = async (payload: Partial<IIssue>) => {
    if (!workspaceSlug || !activeProject) return;

    if (inboxId) await addIssueToInbox(payload);
    else
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

          if (payload.assignees_list?.some((assignee) => assignee === user?.id))
            mutate(USER_ISSUE(workspaceSlug as string));

          if (payload.parent && payload.parent !== "") mutate(SUB_ISSUES(payload.parent));

          if (globalViewId) mutate(GLOBAL_VIEW_ISSUES(globalViewId.toString()));

          if (currentWorkspaceIssuePath) mutate(GLOBAL_VIEW_ISSUES(workspaceSlug.toString()));
        })
        .catch(() => {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Issue could not be created. Please try again.",
          });
        });

    if (!createMore) onFormSubmitClose();
  };

  const createDraftIssue = async () => {
    if (!workspaceSlug || !activeProject || !user) return;

    const payload: Partial<IIssue> = {
      ...formDirtyState,
    };

    await issueDraftService
      .createDraftIssue(workspaceSlug as string, activeProject ?? "", payload)
      .then(() => {
        mutate(PROJECT_DRAFT_ISSUES_LIST_WITH_PARAMS(activeProject ?? "", params));
        if (groupedIssues) mutateMyIssues();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Draft Issue created successfully.",
        });

        handleClose();
        setActiveProject(null);
        setFormDirtyState(null);
        setShowConfirmDiscard(false);

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

  const updateIssue = async (payload: Partial<IIssue>) => {
    if (!user) return;

    await issueService
      .patchIssue(workspaceSlug as string, activeProject ?? "", data?.id ?? "", payload, user)
      .then((res) => {
        if (isUpdatingSingleIssue) {
          mutate<IIssue>(PROJECT_ISSUES_DETAILS, (prevData) => ({ ...prevData, ...res }), false);
        } else {
          if (payload.parent) mutate(SUB_ISSUES(payload.parent.toString()));
          mutate(PROJECT_ISSUES_LIST_WITH_PARAMS(activeProject ?? "", params));
        }

        if (payload.cycle && payload.cycle !== "") addIssueToCycle(res.id, payload.cycle);
        if (payload.module && payload.module !== "") addIssueToModule(res.id, payload.module);

        if (!createMore) onFormSubmitClose();

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
      <ConfirmIssueDiscard
        isOpen={showConfirmDiscard}
        handleClose={() => setShowConfirmDiscard(false)}
        onConfirm={createDraftIssue}
        onDiscard={() => {
          handleClose();
          setActiveProject(null);
          setFormDirtyState(null);
          setShowConfirmDiscard(false);
          clearLocalStorageValue();
        }}
      />

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
                  <IssueForm
                    handleFormSubmit={handleFormSubmit}
                    initialData={data ?? prePopulateData}
                    createMore={createMore}
                    setCreateMore={setCreateMore}
                    handleDiscardClose={onDiscardClose}
                    projectId={activeProject ?? ""}
                    setActiveProject={setActiveProject}
                    status={data ? true : false}
                    user={user}
                    fieldsToShow={fieldsToShow}
                    handleFormDirty={handleFormDirty}
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
